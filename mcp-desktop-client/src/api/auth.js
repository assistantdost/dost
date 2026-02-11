import { apiHelpers } from "../config/axios";

export const signup = async (userData) => {
	return apiHelpers.post("/auth/signup", userData);
};

export const verifyOTP = async (otpData) => {
	return apiHelpers.post("/auth/verify_email_and_signup", otpData);
};

export const resendOTP = async (email) => {
	return apiHelpers.post("/auth/resend_otp", { email });
};

export const login = async (credentials) => {
	return apiHelpers.post("/auth/signin", credentials);
};

export const googleLogin = async (payload) => {
	return apiHelpers.post("/auth/google_signin", { payload });
};

export const logout = async () => {
	return apiHelpers.post("/auth/logout");
};

export const forgotPassword = async (email) => {
	return apiHelpers.post("/auth/forgot_password", { email });
};

export const resetPassword = async (resetData) => {
	return apiHelpers.post("/auth/reset_password", resetData);
};

export const refresh = async () => {
	return apiHelpers.post("/auth/refresh");
};

export default {
	signup,
	verifyOTP,
	resendOTP,
	login,
	googleLogin,
	logout,
	forgotPassword,
	resetPassword,
	refresh,
};
