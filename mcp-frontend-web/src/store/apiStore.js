import { create } from "zustand";
import { toast } from "sonner";
import apiKeys from "../api/apiKeys";

export const useAPIStore = create((set, get) => ({
	apiKeys: [],
	loading: false,
	error: null,

	setLoading: (loading) => set({ loading }),
	setError: (error) => set({ error }),

	// Get all API keys
	getAPIKeys: async () => {
		set({ loading: true, error: null });
		try {
			const response = await apiKeys.getAPIKeys();
			set({ apiKeys: response.api_keys, loading: false });
			return response.api_keys;
		} catch (error) {
			const errorMessage =
				error.response?.data?.detail ||
				error.response?.data?.error ||
				error.response?.data?.message ||
				error.message ||
				"Failed to fetch API keys";
			set({ loading: false, error: errorMessage });
			toast.error(errorMessage);
			throw error;
		}
	},

	// Create new API key
	createAPIKey: async (name) => {
		set({ loading: true, error: null });
		try {
			const response = await apiKeys.createAPIKey(name);
			const newKey = response.api_key;
			set((state) => ({
				apiKeys: [...state.apiKeys, newKey],
				loading: false,
			}));
			toast.success("API key created successfully!");
			return newKey;
		} catch (error) {
			const errorMessage =
				error.response?.data?.detail ||
				error.response?.data?.error ||
				error.response?.data?.message ||
				error.message ||
				"Failed to create API key";
			set({ loading: false, error: errorMessage });
			toast.error(errorMessage);
			throw error;
		}
	},

	// Revoke API key
	revokeAPIKey: async (keyId) => {
		set({ loading: true, error: null });
		try {
			await apiKeys.revokeAPIKey(keyId);
			set((state) => ({
				apiKeys: state.apiKeys.filter((key) => key.id !== keyId),
				loading: false,
			}));
			toast.success("API key revoked successfully!");
		} catch (error) {
			const errorMessage =
				error.response?.data?.detail ||
				error.response?.data?.error ||
				error.response?.data?.message ||
				error.message ||
				"Failed to revoke API key";
			set({ loading: false, error: errorMessage });
			toast.error(errorMessage);
			throw error;
		}
	},

	// Delete API key
	deleteAPIKey: async (keyId) => {
		set({ loading: true, error: null });
		try {
			await apiKeys.deleteAPIKey(keyId);
			set((state) => ({
				apiKeys: state.apiKeys.filter((key) => key.id !== keyId),
				loading: false,
			}));
			toast.success("API key deleted successfully!");
		} catch (error) {
			const errorMessage =
				error.response?.data?.detail ||
				error.response?.data?.error ||
				error.response?.data?.message ||
				error.message ||
				"Failed to delete API key";
			set({ loading: false, error: errorMessage });
			toast.error(errorMessage);
			throw error;
		}
	},
}));
