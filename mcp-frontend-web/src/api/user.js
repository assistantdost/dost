import { apiHelpers } from "../config/axios";

export const getMe = async (fetcher = apiHelpers) => {
	return fetcher.get("/users/me");
};

export default {
	getMe,
};
