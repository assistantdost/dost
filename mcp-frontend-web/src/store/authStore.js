import { create } from "zustand";
import { persist } from "zustand/middleware";
import auth from "../api/auth";
import { toast } from "sonner";
import { setCookie, deleteCookie, getCookie } from "cookies-next";

export const useAuthStore = create(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			loading: false,
			error: null,
			logged: false,
			hydrated: false,
			initialChecked: false,
			isAdmin: () => {
				const user = get().user;
				return user?.role === "admin";
			},
			signupData: {},
			resetPasswordEmail: null,
			setToken: (token) => {
				set({ token });
			},
			clearToken: () => {
				set({ token: null, user: null });
			},
			setUser: (user) => set({ user }),
			clearUser: () => set({ user: null }),
			setLoading: (loading) => set({ loading }),
			setError: (error) => set({ error }),
			setSignUpData: (data) => set({ signupData: data }),

			hasRole: (roles) => {
				const user = get().user;
				if (!user) return false;
				if (Array.isArray(roles)) {
					return roles.includes(user.role);
				}
				return user.role === roles;
			},

			// Signup: Send user data and get OTP
			signup: async (userData) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.signup(userData);
					set({ loading: false });
					toast.success(
						response?.message || "OTP sent successfully!",
					);
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.detail ||
						error.response?.data?.error ||
						error.response?.data?.message ||
						error.message ||
						"Signup failed";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			// Verify OTP (does not log in; user must login separately)
			verifyOTP: async (otpData) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.verifyOTP(otpData);
					set({ loading: false });
					toast.success("OTP verified successfully!");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.detail ||
						error.response?.data?.error ||
						error.response?.data?.message ||
						error.message ||
						"OTP verification failed";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			resendOTP: async (email) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.resendOTP(email);
					set({ loading: false });
					toast.info(response.message || "OTP resent successfully");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.detail ||
						error.response?.data?.error ||
						error.response?.data?.message ||
						error.message ||
						"Resend OTP failed";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			// Login
			login: async (credentials) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.login(credentials);
					const { token, user, message } = response;
					console.log("Login response:", response);
					set({ token, user, loading: false, logged: true });
					toast.success(message || "Login successful!");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.error ||
						error.response?.data?.detail ||
						error.response?.data?.message ||
						error.message ||
						"Login failed";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			// Google Login
			googleLogin: async (payload) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.googleLogin(payload);
					console.log("Google login response:", response);
					const { token, user, message } = response;
					set({ token, user, loading: false, logged: true });
					toast.success(message || "Login successful!");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.detail ||
						error.response?.data?.error ||
						error.response?.data?.message ||
						error.message ||
						"Login failed";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			// Refresh Access Token
			refreshToken: async () => {
				try {
					const response = await auth.refresh();
					const { token, logged } = response;
					set({ token, logged: logged });
					return token;
				} catch (error) {
					set({ token: null, user: null, logged: false });
					throw error;
				}
			},

			// Forgot Password
			forgotPassword: async (email) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.forgotPassword(email);
					set({ loading: false, resetPasswordEmail: email });
					toast.success(
						response?.message || "Password reset OTP sent!",
					);
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.detail ||
						error.response?.data?.error ||
						error.response?.data?.message ||
						error.message ||
						"Failed to send reset OTP";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			// Reset Password
			resetPassword: async (resetData) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.resetPassword(resetData);
					set({ loading: false, resetPasswordEmail: null });
					toast.success("Password reset successfully!");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.detail ||
						error.response?.data?.error ||
						error.response?.data?.message ||
						error.message ||
						"Password reset failed";
					set({
						loading: false,
						error: errorMessage,
					});
					throw error;
				}
			},

			// Logout
			logout: async () => {
				try {
					await auth.logout();
				} catch (error) {
					console.error("Logout error:", error);
				} finally {
					set({
						token: null,
						user: null,
						logged: false,
						error: null,
					});
					toast.success("Logged out successfully");
				}
			},

			unAuthorisedLogout: (message) => {
				set({ token: null, user: null, logged: false, error: null });
				toast.error(message || "Session expired. Please log in again.");
			},

		}),
		{
			name: "dost-mcp-authStore",
			partialize: (state) => ({ user: state.user, logged: state.logged }), // Only persist user
			onRehydrateStorage: () => (state) => {
				state.hydrated = true;
			},
		},
	),
);

