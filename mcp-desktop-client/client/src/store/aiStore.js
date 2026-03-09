import { create } from "zustand";
import { toast } from "sonner";

// Check if we're in renderer process
const isRenderer = typeof window !== "undefined" && window.ai;

// Renderer store (with Zustand and IPC sync)
export const useAiStore = create((set, get) => ({
	providers: null,
	chatModel: null,
	summaryModel: null,
	provider: null, // Provider name (string)
	envStore: null, // Added envStore

	// ========== INITIALIZATION ==========

	// Initialize store from main process
	initialize: async () => {
		if (!isRenderer) return;
		try {
			const state = await window.ai.getState();
			set({
				providers: state.providers || null,
				chatModel: state.chatModel || null,
				summaryModel: state.summaryModel || null,
				provider: state.provider || null,
				envStore: state.envStore || null, // Added
			});
			console.log("✅ AI Store initialized with state:", state);
		} catch (error) {
			console.error("❌ Error initializing AI Store:", error);
			toast.error("Failed to initialize AI Store");
		}
	},

	// ========== RE-INITIALIZE ========== (For example, after login when new API keys might be available)
	reInitialize: async () => {
		if (!isRenderer) return;
		try {
			const result = await window.ai.init();
			if (!result.success) {
				toast.error("Failed to initialize AI", {
					description: result.error,
				});
				console.error("❌ Error initializing AI Store:", result.error);
			} else {
				console.log("✅ AI Store initialized");
			}
		} catch (error) {
			console.error("❌ Error initializing AI Store:", error);
			toast.error("Failed to initialize AI Store");
		}
	},

	// Listen for updates from main process
	listenForUpdates: () => {
		if (!isRenderer) return;

		console.log("👂 Listening for AI state updates from main process...");

		const cleanup = window.ai.onStateUpdated((state) => {
			set({
				providers: state.providers || null,
				chatModel: state.chatModel || null,
				summaryModel: state.summaryModel || null,
				provider: state.provider || null,
				envStore: state.envStore || null, // Added
			});
			console.log("🔄 AI state updated:", state);
		});
		return cleanup;
	},

	// ========== MODEL MANAGEMENT ==========

	// Select chat model
	selectChatModel: async (provider, model) => {
		const envStore = get().envStore;
		const providers = get().providers;
		const chatModel = get().chatModel;
		const currentProvider = get().provider;

		if (!isRenderer) return { success: false };

		const hasApiKey =
			envStore &&
			envStore[provider] &&
			envStore[provider][providers[provider].env_var];

		if (!hasApiKey) {
			toast.warning(`API key not set for ${provider}.`, {
				description: `Please add your API key for ${provider} in the settings to use this model.`,
			});
			return { success: false, error: "API key not set" };
		}

		// To skip re-selecting the current model
		if (
			chatModel &&
			provider === currentProvider &&
			model === chatModel.id
		) {
			// toast.info(`Already using ${provider} - ${chatModel.name}`);
			// console.log(
			// 	`ℹ️ Model ${provider} - ${chatModel.name} is already selected.`,
			// );
			return { success: true };
		}

		try {
			const result = await window.ai.selectChatModel(provider, model);
			if (result.success) {
				toast.success(`Switched to ${provider} - ${model}`);
				console.log(`✅ Selected model: ${provider} - ${model}`);
			} else {
				toast.error(`Failed to select model: ${result.error}`);
			}
			return result;
		} catch (error) {
			console.error("❌ Error selecting chat model:", error);
			toast.error("Failed to select chat model");
			return { success: false, error: error.message };
		}
	},

	// ========== ENV STORE MANAGEMENT ==========

	// Set env store
	setEnvStore: async (envData) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.ai.setEnvStore(envData);
			if (result.success) {
				toast.success(`Environment variables updated`);
				console.log(`✅ Set env:`, envData);
				// Update local state immediately for UI responsiveness
				set((state) => ({
					envStore: { ...state.envStore, ...envData },
				}));
			} else {
				toast.error(`Failed to set env: ${result.error}`);
			}
			return result;
		} catch (error) {
			console.error("❌ Error setting env store:", error);
			toast.error("Failed to set environment variables");
			return { success: false, error: error.message };
		}
	},

	// Get env store
	getEnvStore: async (key) => {
		if (!isRenderer) return null;

		try {
			const result = await window.ai.getEnvStore(key);
			if (result.success) {
				return result.value;
			} else {
				toast.error(`Failed to get env: ${result.error}`);
				return null;
			}
		} catch (error) {
			console.error("❌ Error getting env store:", error);
			toast.error("Failed to get environment variable");
			return null;
		}
	},

	// Delete env store
	deleteEnvStore: async (key) => {
		if (!isRenderer) return { success: false };

		try {
			const result = await window.ai.deleteEnvStore(key);
			if (result.success) {
				toast.success(`Environment variable "${key}" deleted`);
				console.log(`✅ Deleted env: ${key}`);
			} else {
				toast.error(`Failed to delete env: ${result.error}`);
			}
			return result;
		} catch (error) {
			console.error("❌ Error deleting env store:", error);
			toast.error("Failed to delete environment variable");
			return { success: false, error: error.message };
		}
	},

	// ========== GETTERS ==========

	// Get current state
	getState: () => {
		return {
			providers: get().providers,
			chatModel: get().chatModel,
			summaryModel: get().summaryModel,
			provider: get().provider,
			envStore: get().envStore, // Added
		};
	},
}));
