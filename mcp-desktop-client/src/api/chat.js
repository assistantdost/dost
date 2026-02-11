import { apiHelpers } from "../config/axios";

export const getUserChats = async () => {
	return apiHelpers.get("/chats/");
};

export const getChat = async (chatId) => {
	return apiHelpers.get(`/chats/${chatId}`);
};

export const createChat = async (chatData) => {
	return apiHelpers.post("/chats/", chatData);
};

export const updateChat = async (chatId, chatUpdate) => {
	return apiHelpers.patch(`/chats/${chatId}`, chatUpdate);
};

export const deleteChat = async (chatId) => {
	return apiHelpers.delete(`/chats/${chatId}`);
};

export const updateChatName = async (chatId, name) => {
	return apiHelpers.patch(`/chats/${chatId}/name`, { name });
};

export const updateChatSummary = async (
	chatId,
	summary,
	lastSummarizedMessageId,
) => {
	return apiHelpers.patch(`/chats/${chatId}/summary`, {
		summary,
		last_summarized_message_id: lastSummarizedMessageId,
	});
};

export default {
	getUserChats,
	getChat,
	createChat,
	updateChat,
	deleteChat,
	updateChatName,
};
