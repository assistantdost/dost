import {
	createChat,
	deleteChat,
	getChat,
	getUserChats,
	updateChatName,
} from "@/api/chat";

export const queryKeys = {
	chats: {
		all: ["chats"],
		detail: (chatId) => ["chat", chatId],
		detailInfinite: (chatId) => ["chat", chatId, "messages"],
	},
};

export const chatQueryOptions = {
	list: ({ enabled = true, onSuccess } = {}) => ({
		queryKey: queryKeys.chats.all,
		queryFn: async ({ pageParam = null }) => {
			const response = await getUserChats(10, pageParam);
			return response || { chats: [], next_cursor: null };
		},
		enabled,
		onSuccess,
		getNextPageParam: (lastPage) => lastPage.next_cursor,
	}),
	detail: (chatId, { enabled = true } = {}) => ({
		queryKey: queryKeys.chats.detail(chatId),
		queryFn: async () => getChat(chatId, { limit: 30 }),
		enabled,
		retry: false,
		refetchOnMount: "always",
		refetchOnWindowFocus: false,
		staleTime: 0,
	}),
	detailInfinite: (chatId, { enabled = true } = {}) => ({
		queryKey: queryKeys.chats.detailInfinite(chatId),
		queryFn: async ({ pageParam = null }) =>
			getChat(chatId, {
				limit: 10,
				cursor: pageParam,
			}),
		enabled,
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage?.next_cursor ?? null,
		retry: false,
		refetchOnMount: "always",
		refetchOnWindowFocus: false,
		staleTime: 0,
	}),
};

export const chatMutationOptions = {
	create: (queryClient, { onSuccess, onError } = {}) => ({
		mutationFn: (chatData) => createChat(chatData),
		onSuccess: async (response, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.chats.all,
			});
			onSuccess?.(response, variables, context);
		},
		onError,
	}),
	rename: (queryClient, chatId, { onSuccess, onError } = {}) => ({
		mutationFn: (name) => updateChatName(chatId, name),
		onSuccess: async (response, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.chats.all,
			});
			onSuccess?.(response, variables, context);
		},
		onError,
	}),
	delete: (queryClient, chatId, { onSuccess, onError } = {}) => ({
		mutationFn: () => deleteChat(chatId),
		onSuccess: async (response, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.chats.all,
			});
			onSuccess?.(response, variables, context);
		},
		onError,
	}),
};

export async function invalidateChatQueries(queryClient) {
	await queryClient.invalidateQueries({
		queryKey: queryKeys.chats.all,
	});
	await queryClient.invalidateQueries({
		queryKey: ["chat"],
	});
}

export function clearChatQueries(queryClient) {
	queryClient.removeQueries({
		queryKey: queryKeys.chats.all,
	});
	queryClient.removeQueries({
		queryKey: ["chat"],
	});
}
