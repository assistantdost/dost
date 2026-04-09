import React, { useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import ChatWindow from "@/components/ChatWindow";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import useGlobalStore from "@/store/globalStore";
import { useAiStore } from "@/store/aiStore";
import { chatQueryOptions } from "@/lib/tanstackQueries";

function Chat() {
	const { chatId } = useParams();
	const { setSummary, setActiveChatId } = useChatStore();
	const selectChatModel = useAiStore((state) => state.selectChatModel);
	const providers = useAiStore((state) => state.providers);
	const token = useAuthStore((state) => state.token);
	const logged = useGlobalStore((state) => state.logged);

	// Fetch chat messages with infinite query - only when logged and has token
	const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
		useInfiniteQuery(
			chatQueryOptions.detailInfinite(chatId, {
				enabled: !!chatId && logged && !!token,
			}),
		);

	const pages = data?.pages || [];
	const firstPage = pages[0] || null;
	const chatModel = firstPage?.chat_model || null;

	const mergedMessages = useMemo(() => {
		if (pages.length === 0) return [];

		const seenIds = new Set();
		const result = [];

		for (let i = pages.length - 1; i >= 0; i--) {
			const pageMessages = pages[i]?.messages || [];
			for (const message of pageMessages) {
				if (!seenIds.has(message.id)) {
					seenIds.add(message.id);
					result.push(message);
				}
			}
		}

		return result;
	}, [pages]);

	const loadOlderMessages = useCallback(async () => {
		if (!hasNextPage || isFetchingNextPage) return;
		await fetchNextPage();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	// Keep active chat ID in store in sync with route.
	useEffect(() => {
		setActiveChatId(chatId);
	}, [chatId, setActiveChatId]);

	// Update summary metadata when first page changes.
	useEffect(() => {
		if (firstPage?.summary !== undefined) {
			setSummary(firstPage.summary, firstPage.last_summarized_message_id);
		}
	}, [firstPage?.summary, firstPage?.last_summarized_message_id, setSummary]);

	// Select locked model when model/provider context is available.
	useEffect(() => {
		if (!chatModel) {
			return;
		}

		const { provider, name, id } = chatModel;
		const modelFound = providers?.[provider]?.models?.[id] !== null;
		if (modelFound) {
			selectChatModel(provider, id);
		} else {
			toast.warning(`Chat model ${provider} - ${name} not found.`);
		}
	}, [chatModel, providers, selectChatModel]);

	return (
		<section className="w-full ">
			{/* key prop forces remount on chat switch for fresh state */}
			<ChatWindow
				key={chatId}
				chatId={chatId}
				initialMessages={mergedMessages}
				chatLockedModel={chatModel}
				hasMoreOlder={Boolean(hasNextPage)}
				isLoadingOlder={isFetchingNextPage}
				onLoadOlder={loadOlderMessages}
			/>
		</section>
	);
}

export default Chat;
