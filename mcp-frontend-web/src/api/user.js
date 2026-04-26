import { apiHelpers } from "../config/axios";

export const getMe = async () => {
	return apiHelpers.get("/users/me");
};

export default {
	getMe,
};
