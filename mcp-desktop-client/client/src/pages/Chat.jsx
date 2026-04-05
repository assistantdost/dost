import React, { useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ChatWindow from "@/components/ChatWindow";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import useGlobalStore from "@/store/globalStore";
import { useAiStore } from "@/store/aiStore";
import { chatQueryOptions } from "@/lib/tanstackQueries";

function Chat() {
	const { chatId } = useParams();
	const { setMessages, setSummary, setActiveChatId } = useChatStore();
	const selectChatModel = useAiStore((state) => state.selectChatModel);
	const providers = useAiStore((state) => state.providers);
	const token = useAuthStore((state) => state.token);
	const logged = useGlobalStore((state) => state.logged);

	// Fetch chat with React Query - only when logged and has token
	const { data: chat, isLoading } = useQuery(
		chatQueryOptions.detail(chatId, {
			enabled: !!chatId && logged && !!token,
		}),
	);

	// Update messages and summary in store when chat data changes
	useEffect(() => {
		if (chat?.messages) {
			setMessages(chat.messages);
		}
		if (chat?.summary !== undefined) {
			setSummary(chat.summary, chat.last_summarized_message_id);
		}

		// If chat has a locked model, try to select it
		if (chat?.chat_model !== undefined) {
			const { provider, name, id } = chat?.chat_model;
			const modelFound = providers?.[provider].models?.[id] !== null;
			if (modelFound) {
				selectChatModel(provider, id);
			} else {
				toast.warning(`Chat model ${provider} - ${name} not found.`);
			}
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
				chatLockedModel={chat?.chat_model || null}
			/>
		</section>
	);
}

export default Chat;
