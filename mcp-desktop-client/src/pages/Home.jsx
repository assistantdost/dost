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
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChat } from "@/api/chat";
import { toast } from "sonner";

function Home() {
	const { logged, user } = useAuthStore();
	const { addChat } = useChatStore();
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
		if (!input.trim() || createChatMutation.isPending) return;

		createChatMutation.mutate({
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

					<PromptInput onSubmit={handleCreateChat}>
						<PromptInputTextarea
							placeholder="Type your message here..."
							value={input}
							onChange={(e) => setInput(e.currentTarget.value)}
							disabled={createChatMutation.isPending}
						/>
						<PromptInputToolbar>
							<div className="flex-1" />
							<PromptInputSubmit
								disabled={
									!input.trim() ||
									createChatMutation.isPending
								}
							/>
						</PromptInputToolbar>
					</PromptInput>
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
