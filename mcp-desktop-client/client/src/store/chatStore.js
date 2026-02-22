import { create } from "zustand";

export const useChatStore = create((set, get) => ({
	// Current active chat ID
	activeChatId: null,

	// Messages for the current chat
	messages: [],

	// Summary data for current chat
	summary: null,
	lastSummarizedMessageId: null,

	// Loading state for chat messages
	isLoadingChat: false,

	// Set active chat ID
	setActiveChatId: (chatId) => {
		set({ activeChatId: chatId });
	},

	// Set messages for current chat
	setMessages: (messages) => {
		set({ messages });
	},

	// Set summary for current chat
	setSummary: (summary, lastSummarizedMessageId) => {
		set({
			summary,
			lastSummarizedMessageId,
		});
	},

	// Add a message to current chat
	addMessage: (message) => {
		set((state) => ({
			messages: [...state.messages, message],
		}));
	},

	// Append multiple messages
	appendMessages: (newMessages) => {
		set((state) => ({
			messages: [...state.messages, ...newMessages],
		}));
	},

	// Set loading state for chat
	setLoadingChat: (isLoading) => set({ isLoadingChat: isLoading }),
}));
