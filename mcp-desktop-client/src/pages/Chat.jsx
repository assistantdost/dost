import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ChatWindow from "@/components/ChatWindow";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { getChat } from "@/api/chat";

function Chat() {
	const { chatId } = useParams();
	const { setMessages, setSummary, setActiveChatId } = useChatStore();
	const { logged, token } = useAuthStore();

	// Fetch chat with React Query - only when logged and has token
	const { data: chat, isLoading } = useQuery({
		queryKey: ["chat", chatId],
		queryFn: async () => {
			const response = await getChat(chatId);
			return response;
		},
		enabled: !!chatId && logged && !!token,
		retry: false,
		refetchOnMount: "always", // ✅ Always refetch when chat is opened
		refetchOnWindowFocus: false, // Don't refetch on window focus
		staleTime: 0, // ✅ Consider data immediately stale
	});

	// Update messages and summary in store when chat data changes
	useEffect(() => {
		if (chat?.messages) {
			setMessages(chat.messages);
		}
		if (chat?.summary !== undefined) {
			setSummary(chat.summary, chat.last_summarized_message_id);
		}
		setActiveChatId(chatId);
	}, [chat]);

	return (
		<section className="w-full ">
			{/* key prop forces remount on chat switch for fresh state */}
			<ChatWindow
				key={chatId}
				chatId={chatId}
				initialMessages={chat?.messages || []}
			/>
		</section>
	);
}

export default Chat;
