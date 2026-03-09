import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import {
	PromptInput,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputSubmit,
} from "@/components/ai/prompt-input";
import AiModelSelector from "@/components/ai/model-selector";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChat } from "@/api/chat";
import { toast } from "sonner";
import { useAiStore } from "@/store/aiStore";

function Home() {
	const { logged, user } = useAuthStore();
	const { addChat } = useChatStore();
	const chatModel = useAiStore((state) => state.chatModel);
	const provider = useAiStore((state) => state.provider);
	const envStore = useAiStore((state) => state.envStore);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [welcomeMessage, setWelcomeMessage] = useState("");
	const [input, setInput] = useState("");

	// Array of 10 different welcome messages
	const welcomeMessages = [
		"What can I help you with today?",
		"How can I assist you today?",
		"What would you like to explore?",
		"Ready to dive into something new?",
		"What's on your mind?",
		"How may I be of service?",
		"Let's get started! What can I do for you?",
		"I'm here to help. What's your question?",
		"What adventure shall we embark on today?",
		"Tell me, what's your goal today?",
	];

	useEffect(() => {
		// Randomly select a welcome message on component mount
		const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
		setWelcomeMessage(welcomeMessages[randomIndex]);
	}, []);

	// useEffect(() => {
	// 	initialize();
	// 	const cleanup = listenForUpdates();
	// 	return cleanup;
	// }, [initialize, listenForUpdates]);

	// Check if any API keys are set
	const hasApiKeys = () => {
		if (!envStore) return false;
		for (const providerKeys of Object.values(envStore)) {
			if (providerKeys && typeof providerKeys === "object") {
				for (const value of Object.values(providerKeys)) {
					if (value && value.trim()) return true;
				}
			}
		}
		return false;
	};

	// Create chat mutation
	const createChatMutation = useMutation({
		mutationFn: (chatData) => createChat(chatData),
		onSuccess: (response) => {
			const newChat = response;

			// Invalidate chats query to refetch the list
			queryClient.invalidateQueries({ queryKey: ["chats"] });

			// Navigate to the new chat
			navigate(`/chat/${newChat.id}`);
		},
	});

	const handleCreateChat = async (e) => {
		e.preventDefault();
		if (!input.trim() || createChatMutation.isPending || !hasApiKeys())
			return;

		createChatMutation.mutate({
			chat_model: {
				id: chatModel?.id || "default-model",
				name: chatModel?.name || "Default Model",
				provider: provider || "unknown",
			},
			first_message: {
				role: "user",
				parts: [
					{
						type: "text",
						text: input.trim(),
					},
				],
			},
		});
	};

	if (logged) {
		return (
			<div className="flex items-center justify-center min-h-[80vh] p-4">
				<div className="w-full max-w-2xl space-y-6">
					<div className="text-center space-y-2">
						<h1 className="text-4xl font-bold">
							Welcome back, {user?.name || "there"}
						</h1>
						<p className="text-muted-foreground">
							{welcomeMessage}
						</p>
					</div>

					<div className="space-y-4">
						<PromptInput onSubmit={handleCreateChat}>
							<PromptInputTextarea
								placeholder="Type your message here..."
								value={input}
								onChange={(e) =>
									setInput(e.currentTarget.value)
								}
								disabled={createChatMutation.isPending}
							/>
							<PromptInputToolbar>
								<div className="flex-1 flex justify-between">
									<AiModelSelector />
									<PromptInputSubmit
										disabled={
											!input.trim() ||
											createChatMutation.isPending ||
											!hasApiKeys()
										}
									/>
								</div>
							</PromptInputToolbar>
						</PromptInput>

						{!hasApiKeys() && (
							<div className="text-center flex w-full justify-center items-center space-x-2">
								<p className="text-xs text-muted-foreground">
									Set up your API keys to start chatting
								</p>
								<Button
									// variant="secondary"
									size="xs"
									className="text-xs px-2 cursor-pointer"
									onClick={() => navigate("/settings")}
								>
									Settings
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-[80vh] p-4">
			<div className="text-center space-y-6 max-w-md">
				<div className="space-y-2">
					<h1 className="text-5xl font-bold">DOST MCP</h1>
					<p className="text-xl text-muted-foreground">
						Your intelligent assistant
					</p>
				</div>

				<Button
					onClick={() => navigate("/login")}
					size="lg"
					className="w-full"
				>
					Get Started
				</Button>
			</div>
		</div>
	);
}

export default Home;
