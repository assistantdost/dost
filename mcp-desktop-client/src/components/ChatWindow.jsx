"use client";

import {
	Conversation,
	ConversationContent,
} from "@/components/ai/conversation";
import { Message, MessageContent } from "@/components/ai/message";
import {
	PromptInput,
	PromptInputTextarea,
	PromptInputSubmit,
} from "@/components/ai/prompt-input";

import {
	Reasoning,
	ReasoningTrigger,
	ReasoningContent,
} from "@/components/ai/reasoning";

import {
	Sources,
	SourcesTrigger,
	SourcesContent,
	Source,
} from "@/components/ai/source";

import {
	Tool,
	ToolHeader,
	ToolContent,
	ToolInput,
	ToolOutput,
} from "@/components/ai/tool";

import { SummarizingMessages } from "@/components/chat/SummarizingMessages";

import { Response } from "@/components/ai/response";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
	useState,
	useEffect,
	useRef,
	useMemo,
	useLayoutEffect,
	useCallback,
	memo,
} from "react";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { updateChatSummary, updateChat } from "@/api/chat";

import { isWithinTokenLimit } from "gpt-tokenizer/model/gpt-4o";

import axios from "axios";

// ✅ Environment-based API URL
const API_URL =
	import.meta.env.REACT_APP_PUBLIC_API_URL || "http://localhost:5599";

const SUMMARY_TRIGGER_TOKENS =
	parseInt(import.meta.env.VITE_SUMMARY_TRIGGER_TOKENS) || 1000;

const partsToText = (parts) => {
	return parts
		.map((part) => {
			switch (part.type) {
				case "text":
					return part.text;
				case "reasoning":
					return `Reasoning: ${part.text}`;
				case "tool-call":
					return `Tool Call: ${part.toolName}(${JSON.stringify(part.input)})`;
				case "tool-result":
					const outputText =
						part.output?.content?.[0]?.text ||
						part.output?.structuredContent?.result ||
						JSON.stringify(part.output);
					return `Tool Result (${part.toolName}): ${outputText}`;
				case "step-start":
					return "Step started";
				case "dynamic-tool":
					return `Tool (${part.toolName}): ${part.state} - Input: ${JSON.stringify(part.input)} - Output: ${part.output?.content?.[0]?.text || "Pending"}`;
				case "sources":
					return `Sources: ${part.sources?.map((s) => s.url).join(", ") || "None"}`;
				default:
					return `Unknown part type ${part.type}: ${JSON.stringify(part)}`;
			}
		})
		.join("\n");
};

// ✅ Memoized Message Component for better performance
const MemoizedMessagePart = memo(({ part, messageId, index, status, role }) => {
	switch (part.type) {
		case "text":
			return (
				<Response
					key={`${messageId}-${index}`}
					state={part.state || "done"}
					role={role}
				>
					{part.text}
				</Response>
			);
		case "reasoning":
			return (
				<Reasoning
					key={`${messageId}-${index}`}
					isStreaming={status === "streaming"}
					defaultOpen={false}
				>
					<ReasoningTrigger />
					<ReasoningContent>{part.text}</ReasoningContent>
				</Reasoning>
			);
		case "dynamic-tool":
			return (
				<Tool
					key={`${messageId}-${index}`}
					defaultOpen={part.state === "output-available"}
				>
					<ToolHeader
						type={part.type}
						toolName={part.toolName}
						state={part.state}
					/>
					<ToolContent>
						<ToolInput input={part.input} />
						{part.state === "output-available" && (
							<ToolOutput
								output={
									part.output?.content?.[0]?.type ===
										"text" && (
										<Response state="done">
											{part.output.content[0].text}
										</Response>
									)
								}
								errorText={part.errorText}
							/>
						)}
					</ToolContent>
				</Tool>
			);
		default:
			console.warn(`Unknown part type: ${part.type}`);
			return null;
	}
});

MemoizedMessagePart.displayName = "MemoizedMessagePart";

export default function ChatWindow({ chatId, initialMessages = [] }) {
	const [input, setInput] = useState("");
	const [isUserScrolling, setIsUserScrolling] = useState(false);
	const [summarizing, setSummarizing] = useState(false);

	const { messages, setMessages, sendMessage, status, error } = useChat({
		id: chatId,
		initialMessages,
		transport: new DefaultChatTransport({
			api: `${API_URL}/api/chat`,
			async prepareSendMessagesRequest({ messages, id }) {
				// ✅ Read fresh values from store every time
				const { summary, lastSummarizedMessageId, setSummary } =
					useChatStore.getState();
				let recentMessages = messages;

				if (summary && lastSummarizedMessageId) {
					const index = messages.findIndex(
						(m) => m.id === lastSummarizedMessageId,
					);
					if (index !== -1) {
						recentMessages = messages.slice(index + 1);
					}

					const summaryMessage = {
						role: "system",
						parts: [
							{
								type: "text",
								text: summary,
							},
						],
					};

					recentMessages = [summaryMessage, ...recentMessages];
				}

				// ✅ Convert ALL parts to comprehensive text content
				const convertedMessages = recentMessages.map((msg) => {
					if (msg.content) return msg;
					if (msg.parts) {
						// Include ALL part types as text (reasoning, tools, etc.)
						const textContent = partsToText(msg.parts);
						return {
							role: msg.role,
							content: textContent,
						};
					}
					return msg;
				});

				const withinTokenLimit = isWithinTokenLimit(
					convertedMessages,
					SUMMARY_TRIGGER_TOKENS, // Adjust token limit as needed
				);

				if (!withinTokenLimit) {
					setSummarizing(true);
					const summarisedMessage = await axios.post(
						`${API_URL}/api/summarize`,
						{ messages: recentMessages.slice(0, -1) },
					);
					setSummarizing(false);

					const summaryText = summarisedMessage.data.parts
						.map((part) => part.text)
						.join("\n");
					const lastSummarizedMessageId =
						recentMessages[recentMessages.length - 2].id;

					updateChatSummary(
						chatId,
						summaryText,
						lastSummarizedMessageId,
					);

					setSummary(summaryText, lastSummarizedMessageId);

					recentMessages = [
						summarisedMessage.data,
						...recentMessages.slice(-1),
					];
				}

				return {
					body: {
						messages: recentMessages,
						chatId: id,
					},
				};
			},
		}),
		onFinish: async ({ messages }) => {
			try {
				// ✅ Update backend with only the last message
				const temp =
					messages.length > 2
						? messages.slice(-2)
						: messages.slice(-1);
				// console.log("Updating chat with messages:", temp);
				await updateChat(chatId, {
					messages: temp,
				});

				// // ✅ Update store with only the last message
				// appendMessages(chatId, temp);
			} catch (error) {
				console.error("Failed to update chat:", error);
			}
		},
		onError: (error) => {
			console.error("Chat error:", error);
			toast.error("Error Sending Message", {
				description: error.message || "An unexpected error occurred.",
			});
		},
	});

	const scrollRef = useRef(null);
	const debounceTimeoutRef = useRef(null);
	const inputRef = useRef(null);
	const isNearBottomRef = useRef(true);

	// ✅ Load messages when initialMessages change or on mount
	useEffect(() => {
		if (initialMessages.length === 0) return;

		// Set messages from backend
		setMessages(initialMessages);

		// Check if this is a new chat (has user message but no assistant response)
		const hasUserMessage = initialMessages.some((m) => m.role === "user");
		const hasAssistantResponse = initialMessages.some(
			(m) => m.role === "assistant",
		);

		// If new chat with only user message, trigger AI call
		if (hasUserMessage && !hasAssistantResponse) {
			setTimeout(() => sendMessage(), 50);
		}
	}, [chatId, initialMessages]); // Run when chat changes or messages load

	// ✅ Detect if user is scrolling manually
	const handleScroll = useCallback(() => {
		if (!scrollRef.current) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

		// Consider "near bottom" if within 100px
		isNearBottomRef.current = distanceFromBottom < 100;
		setIsUserScrolling(distanceFromBottom > 100);
	}, []);

	// ✅ Debounced auto-scroll to bottom (only if user is near bottom)
	useLayoutEffect(() => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		debounceTimeoutRef.current = setTimeout(() => {
			if (scrollRef.current && isNearBottomRef.current) {
				scrollRef.current.scrollTo({
					top: scrollRef.current.scrollHeight,
					behavior: "smooth",
				});
			}
		}, 50);

		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, [messages]);

	// ✅ Form submission with error handling and focus management
	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();
			if (!input.trim()) return;

			try {
				sendMessage({ text: input });
				setInput("");
				// Reset scroll tracking
				isNearBottomRef.current = true;
				setIsUserScrolling(false);
				// Focus back to input after sending
				setTimeout(() => inputRef.current?.focus(), 0);
			} catch (err) {
				console.error("Failed to send message:", err);
				toast.error("Error Sending Message", {
					description: err.message || "An unexpected error occurred.",
				});
			}
		},
		[input, sendMessage, toast],
	);

	// ✅ Keyboard shortcuts
	const handleKeyDown = useCallback(
		(e) => {
			// Enter to send (Shift+Enter for new line)
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit(e);
			}
		},
		[handleSubmit],
	);

	// ✅ Memoize rendered messages with better validation
	const renderedMessages = useMemo(() => {
		return messages.map((message) => {
			// Validate message structure
			if (!message.id || !message.role) {
				console.warn("Invalid message structure:", message);
				return null;
			}

			return (
				<div key={message.id}>
					{message.role === "assistant" &&
						message.sources &&
						Array.isArray(message.sources) &&
						message.sources.length > 0 && (
							<Sources>
								<SourcesTrigger
									count={message.sources.length}
								/>
								<SourcesContent>
									{message.sources.map((source, i) => (
										<Source
											key={`${message.id}-source-${i}`}
											href={source.url}
											title={source.title || source.url}
										/>
									))}
								</SourcesContent>
							</Sources>
						)}

					<Message from={message.role}>
						<MessageContent>
							{message.parts?.map((part, i) => (
								<MemoizedMessagePart
									key={`${message.id}-part-${i}`}
									part={part}
									messageId={message.id}
									index={i}
									status={status}
									role={message.role}
								/>
							))}
						</MessageContent>
					</Message>
				</div>
			);
		});
	}, [messages, status]);

	// ✅ Scroll to bottom button (shown when user scrolls up)
	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
			isNearBottomRef.current = true;
			setIsUserScrolling(false);
		}
	}, []);

	// ✅ Show loading state for initial messages
	const isLoading = status === "streaming" && messages.length === 0;

	return (
		<div className="flex flex-col h-full max-w-4xl mx-auto">
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="relative overflow-y-auto h-[80vh]"
				role="log"
				aria-live="polite"
				aria-label="Chat conversation"
			>
				<Conversation>
					<ConversationContent>
						{isLoading && (
							<div className="flex items-center justify-center h-full">
								<div className="animate-pulse text-muted-foreground">
									Loading conversation...
								</div>
							</div>
						)}
						{renderedMessages}
						{summarizing && <SummarizingMessages />}
					</ConversationContent>
				</Conversation>

				{/* ✅ Scroll to bottom button */}
				{isUserScrolling && (
					<button
						onClick={scrollToBottom}
						className="fixed bottom-24 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-10"
						aria-label="Scroll to bottom"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m18 15-6 6-6-6" />
						</svg>
					</button>
				)}
			</div>

			<PromptInput onSubmit={handleSubmit}>
				<PromptInputTextarea
					ref={inputRef}
					value={input}
					onChange={(e) => setInput(e.currentTarget.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask for markdown content... (Enter to send, Shift+Enter for new line)"
					// disabled={status === "streaming"}
					aria-label="Message input"
				/>
				<PromptInputSubmit
					disabled={!input.trim() || status === "streaming"}
					status={status}
				/>
			</PromptInput>

			{/* ✅ Error display */}
			{/* {error && (
                <div className="mt-2 p-2 text-sm text-destructive bg-destructive/10 rounded">
                    {error.message || "An error occurred"}
                </div>
            )} */}
		</div>
	);
}
