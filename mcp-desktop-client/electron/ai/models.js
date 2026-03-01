import store from "../store.js";
import { config } from "../config.js";

const LLM_MODELS = config.API_URL + "/llm_models";

export class AIModel {
	constructor() {
		this.providers = null;
		this.chatModel = null;
		this.summaryModel = null;
		this.provider = null;
	}

	async init() {
		await this.getModels();

		let aiConfig = store.get("aiConfig") || {};

		// Collect all unique env vars from providers
		const envVars = new Set();
		for (const provider of Object.values(this.providers)) {
			if (provider.env_var) {
				envVars.add(provider.env_var);
			}
		}

		const envStore = aiConfig.envStore;

		if (!envStore) {
			// First load: no envStore in aiConfig
			const newEnvStore = Object.fromEntries(
				Array.from(envVars).map((envVar) => [envVar, null]),
			);
			aiConfig.envStore = newEnvStore;
		} else {
			// Load existing envs and set process.env
			for (const envVar of envVars) {
				const value = envStore[envVar];
				if (value !== null && value !== undefined) {
					process.env[envVar] = value;
				}
			}
		}

		if (
			aiConfig.chatModel == null &&
			aiConfig.summaryModel == null &&
			aiConfig.provider == null
		) {
			// Case 1: First load, set defaults from providers
			const defaultProvider = this.providers["groq"]; // or from data.default_provider
			aiConfig.provider = "groq";
			aiConfig.chatModel = defaultProvider.default_model;
			aiConfig.summaryModel = defaultProvider.summary_model;

			// Set this.* to expanded objects
			this.provider = defaultProvider;
			this.chatModel = defaultProvider.models[aiConfig.chatModel];
			this.summaryModel = defaultProvider.models[aiConfig.summaryModel];
		} else {
			// Case 2: Load from aiConfig
			this.provider = this.providers[aiConfig.provider];
			this.chatModel =
				this.providers[aiConfig.provider].models[aiConfig.chatModel];
			this.summaryModel =
				this.providers[aiConfig.provider].models[aiConfig.summaryModel];
		}

		// Save aiConfig to store
		store.set("aiConfig", aiConfig);
	}

	async getModels() {
		if (this.providers) {
			return this.providers;
		}
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(LLM_MODELS, {
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			if (!response.ok) {
				throw new Error(
					`Error fetching models: ${response.statusText}`,
				);
			}
			const data = await response.json();
			this.providers = data.providers;
			return this.providers;
		} catch (error) {
			console.error("Failed to fetch models:", error);
			throw error;
		}
	}

	// Method to select chat model
	selectChatModel(provider, model) {
		let aiConfig = store.get("aiConfig") || {};
		aiConfig.provider = provider;
		aiConfig.chatModel = model;
		// Optionally set summaryModel to provider's default
		aiConfig.summaryModel = this.providers[provider].summary_model;

		// Update this.*
		this.provider = this.providers[provider];
		this.chatModel = this.providers[provider].models[model];
		this.summaryModel =
			this.providers[provider].models[aiConfig.summaryModel];

		// Save to store
		store.set("aiConfig", aiConfig);
	}

	// Methods for store.aiConfig (renamed from apiConfig)
	setAiConfig(key, value) {
		const aiConfig = store.get("aiConfig") || {};
		aiConfig[key] = value;
		store.set("aiConfig", aiConfig);
	}

	getAiConfig(key) {
		const aiConfig = store.get("aiConfig") || {};
		return aiConfig[key];
	}

	deleteAiConfig(key) {
		const aiConfig = store.get("aiConfig") || {};
		delete aiConfig[key];
		store.set("aiConfig", aiConfig);
	}

	// Methods for store.aiConfig.envStore
	setEnvStore(key, value) {
		const aiConfig = store.get("aiConfig") || {};
		if (!aiConfig.envStore) aiConfig.envStore = {};
		aiConfig.envStore[key] = value;
		store.set("aiConfig", aiConfig);
		// Also update process.env if setting a value
		if (value !== null && value !== undefined) {
			process.env[key] = value;
		}
	}

	getEnvStore(key) {
		const aiConfig = store.get("aiConfig") || {};
		const envStore = aiConfig.envStore || {};
		return envStore[key];
	}

	deleteEnvStore(key) {
		const aiConfig = store.get("aiConfig") || {};
		if (aiConfig.envStore) {
			delete aiConfig.envStore[key];
			store.set("aiConfig", aiConfig);
		}
		// Also remove from process.env
		delete process.env[key];
	}
}

export const aiModel = new AIModel();
