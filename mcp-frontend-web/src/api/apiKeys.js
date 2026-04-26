import { apiHelpers } from "../config/axios";

export const getAPIKeys = async (fetcher = apiHelpers) => {
	return fetcher.get("/api-keys");
};

export const createAPIKey = async (name, fetcher = apiHelpers) => {
	return fetcher.post("/api-keys", { name });
};

export const revokeAPIKey = async (keyId, fetcher = apiHelpers) => {
	return fetcher.patch(`/api-keys/${keyId}/revoke`);
};

export const deleteAPIKey = async (keyId, fetcher = apiHelpers) => {
	return fetcher.delete(`/api-keys/${keyId}`);
};

export default {
	getAPIKeys,
	createAPIKey,
	revokeAPIKey,
	deleteAPIKey,
};
