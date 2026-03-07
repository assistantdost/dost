import { apiHelpers } from "../config/axios";

export const getAPIKeys = async () => {
	return apiHelpers.get("/api-keys");
};

export const createAPIKey = async (name) => {
	return apiHelpers.post("/api-keys", { name });
};

export const revokeAPIKey = async (keyId) => {
	return apiHelpers.patch(`/api-keys/${keyId}/revoke`);
};

export const deleteAPIKey = async (keyId) => {
	return apiHelpers.delete(`/api-keys/${keyId}`);
};

export default {
	getAPIKeys,
	createAPIKey,
	revokeAPIKey,
	deleteAPIKey,
};
