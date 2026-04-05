import { create } from "zustand";
import customStorage from "./customStorage";
import { persist } from "zustand/middleware";
import auth from "../api/auth";
import { toast } from "sonner";
import useGlobalStore from "./globalStore";
import { queryClient } from "../lib/queryClient";
import { clearChatQueries } from "../lib/tanstackQueries";
import { useChatStore } from "./chatStore";

function clearLocalChatState() {
	const chatStore = useChatStore.getState();
	chatStore.setActiveChatId(null);
	chatStore.setMessages([]);
	chatStore.setSummary(null, null);
}

function clearSessionQueries() {
	clearChatQueries(queryClient);
}

export const useAuthStore = create(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			loading: false,
			error: null,
			hydrated: false,
			isAdmin: () => {
				const user = get().user;
				return user?.role === "admin";
			},
			signupData: {},
			setToken: (token) => set({ token }),
			clearToken: () => {
				set({ token: null, user: null });
				useGlobalStore.getState().setLogged(false);
				clearSessionQueries();
				clearLocalChatState();
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
					set({ token, user, loading: false });
					useGlobalStore.getState().setLogged(true);
					if (window.authAPI) {
						window.authAPI.setToken(token);
					}
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
					set({ token, user, loading: false });
					useGlobalStore.getState().setLogged(true);
					if (window.authAPI) {
						window.authAPI.setToken(token);
					}
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
					const { token } = response;
					console.log("Token refreshed:", token);
					set({ token });
					useGlobalStore.getState().setLogged(true);
					if (window.authAPI) {
						window.authAPI.setToken(token);
					}
					return token;
				} catch (error) {
					set({ token: null, user: null });
					useGlobalStore.getState().setLogged(false);
					clearSessionQueries();
					clearLocalChatState();
					if (window.authAPI) {
						window.authAPI.clearToken();
					}
					throw error;
				}
			},

			// Logout
			logout: async () => {
				try {
					await auth.logout();
				} catch (error) {
					// Ignore API errors, still logout locally
				}
				set({ token: null, user: null, error: null });
				useGlobalStore.getState().setLogged(false);
				clearSessionQueries();
				clearLocalChatState();
				if (window.authAPI) {
					window.authAPI.clearToken();
				}
				toast.success("Logged out successfully");
			},

			unAuthorisedLogout: (message) => {
				set({ token: null, user: null, error: null });
				useGlobalStore.getState().setLogged(false);
				clearSessionQueries();
				clearLocalChatState();
				if (window.authAPI) {
					window.authAPI.clearToken();
				}
				toast.error(message || "Session expired. Please log in again.");
			},
		}),
		{
			name: "authStore",
			storage: customStorage,
			partialize: (state) => ({ user: state.user }),
			onRehydrateStorage: () => (state) => {
				state.hydrated = true;
			},
		},
	),
);
