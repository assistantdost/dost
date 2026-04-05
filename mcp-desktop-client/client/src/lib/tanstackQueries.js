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
	},
};

export const chatQueryOptions = {
	list: ({ enabled = true, onSuccess } = {}) => ({
		queryKey: queryKeys.chats.all,
		queryFn: async () => {
			const response = await getUserChats();
			return response || [];
		},
		enabled,
		onSuccess,
	}),
	detail: (chatId, { enabled = true } = {}) => ({
		queryKey: queryKeys.chats.detail(chatId),
		queryFn: async () => getChat(chatId),
		enabled,
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
