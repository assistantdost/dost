import { convertToModelMessages, ToolLoopAgent, stepCountIs } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { EventEmitter } from "events";

import store from "../store.js";
import { config } from "../config.js";
import os from "os";

const LLM_MODELS = config.API_URL + "/llm_models";

function resolveStore() {
	return typeof store === "function" ? store() : store;
}

export class AIModel extends EventEmitter {
	constructor() {
		super();
		this.state = new Proxy(
			{
				providers: null,
				chatModel: null,
				summaryModel: null,
				provider: null, // Now stores provider name (string)
				envStore: null, // Added envStore to state
			},
			{
				set: (target, prop, value) => {
					console.log(`AIModel state change:`);
					const oldValue = target[prop];
					target[prop] = value;
					if (oldValue !== value) {
						this.emit("ai-state-changed", this.getState());
					}
					return true;
				},
			},
		);
		this.systemEnv = {}; // Not in state, so changes don't emit
	}

	async init() {
		await this.getModels();
		this.clearProviderEnvVars();

		let aiConfig = resolveStore().get("aiConfig") || {};

		// Collect env vars grouped by provider
		const envStore = aiConfig.envStore;

		if (!envStore) {
			// First load: no envStore in aiConfig
			const newEnvStore = {};
			for (const [providerName, provider] of Object.entries(
				this.state.providers,
			)) {
				if (provider.env_var) {
					newEnvStore[providerName] = { [provider.env_var]: null };
				}
			}
			aiConfig.envStore = newEnvStore;
			this.state.envStore = newEnvStore; // Set in state
		} else {
			// Load existing envs and set process.env
			for (const [providerName, provider] of Object.entries(
				this.state.providers,
			)) {
				if (
					provider.env_var &&
					envStore[providerName] &&
					envStore[providerName][provider.env_var]
				) {
					process.env[provider.env_var] =
						envStore[providerName][provider.env_var];
				}
			}
			this.state.envStore = envStore; // Set in state
		}

		if (
			aiConfig.chatModel == null &&
			aiConfig.summaryModel == null &&
			aiConfig.provider == null
		) {
			// Case 1: First load, set defaults from providers
			const defaultProvider = this.state.providers["groq"]; // or from data.default_provider
			aiConfig.provider = "groq";
			aiConfig.chatModel = defaultProvider.default_model;
			aiConfig.summaryModel = defaultProvider.summary_model;

			// Set this.state.* to expanded objects
			this.state.provider = aiConfig.provider; // Store provider name
			this.state.chatModel = defaultProvider.models[aiConfig.chatModel];
			this.state.summaryModel =
				defaultProvider.models[aiConfig.summaryModel];
		} else {
			// Case 2: Load from aiConfig
			this.state.provider = aiConfig.provider; // Store provider name
			this.state.chatModel =
				this.state.providers[aiConfig.provider].models[
					aiConfig.chatModel
				];
			this.state.summaryModel =
				this.state.providers[aiConfig.provider].models[
					aiConfig.summaryModel
				];
		}

		// Save aiConfig to store
		resolveStore().set("aiConfig", aiConfig);

		this.getSystemEnv();
	}

	clearProviderEnvVars() {
		if (!this.state.providers) {
			return;
		}

		for (const provider of Object.values(this.state.providers)) {
			if (provider?.env_var) {
				delete process.env[provider.env_var];
			}
		}
	}

	async getModels() {
		if (this.state.providers) {
			return this.state.providers;
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
			this.state.providers = data.providers; // This will trigger emit
			return this.state.providers;
		} catch (error) {
			console.error("Failed to fetch models:", error);
			throw error;
		}
	}

	getSystemEnv() {
		const platform = os.platform(); // 'win32', 'darwin', 'linux'
		const release = os.release(); // e.g. '10.0.22631'
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. 'Asia/Kolkata'
		const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g. 'en-IN'
		const arch = os.arch(); // e.g. 'x64'

		const osName =
			platform === "win32"
				? `Windows (Build ${release})`
				: platform === "darwin"
					? `macOS ${release}`
					: `Linux ${release}`;

		this.systemEnv = { osName, arch, timezone, locale };
	}

	// Method to select chat model
	selectChatModel(provider, model) {
		let aiConfig = resolveStore().get("aiConfig") || {};
		aiConfig.provider = provider;
		aiConfig.chatModel = model;
		// Optionally set summaryModel to provider's default
		aiConfig.summaryModel = this.state.providers[provider].summary_model;

		// Update this.state.*
		this.state.provider = provider; // Store provider name
		this.state.chatModel = this.state.providers[provider].models[model];
		this.state.summaryModel =
			this.state.providers[provider].models[aiConfig.summaryModel];

		// Save to store
		resolveStore().set("aiConfig", aiConfig);
	}

	// Dynamic chatAgent method
	async chatAgent(tools) {
		// Dynamically select model based on this.state.provider and this.state.chatModel
		let model;
		let includedTools = {};
		if (this.state.provider === "groq") {
			model = groq(this.state.chatModel.id);
			if (this.state.chatModel.capabilities.browser_search === true) {
				console.log(
					"Including browser_search tool based on model capabilities",
				);
				includedTools.browser_search = groq.tools.browserSearch({});
			}
		} else if (this.state.provider === "google") {
			model = google(this.state.chatModel.id);
		} else {
			throw new Error(`Unsupported provider: ${this.state.provider}`);
		}

		const agent = new ToolLoopAgent({
			model,
			tools: {
				...tools,
				...includedTools,
			},
			toolChoice: "auto",
			stopWhen: stepCountIs(8),
			system: `You are **Dost** — a smart, proactive personal desktop assistant running on the user's PC.
You are powered by MCP (Model Context Protocol) and have access to a dynamic set of tools that can be expanded at any time by connecting new MCP servers. Always read tool names and descriptions carefully — new tools may appear that you haven't seen before. Use them confidently based on their descriptions.

## Environment
- Operating System: ${this.systemEnv.osName} (${this.systemEnv.arch}) | Timezone: ${this.systemEnv.timezone} | Locale: ${this.systemEnv.locale}
- Default user_id: "default" (use this unless told otherwise).

## How to Use Tools
- **Be proactive** — don't just describe what could be done, actually do it using your tools.
- **Chain tools** when a task requires multiple steps. If one tool's output provides input for another, continue the chain automatically.
- **Read tool descriptions** carefully before calling them. Tools are dynamically loaded and may include ones you haven't encountered before — trust the description and schema.
- **Handle errors gracefully** — if a tool fails, briefly explain what went wrong and suggest an alternative or retry.
- **Confirm before destructive/irreversible actions** — e.g., shutting down/restarting the PC, deleting scheduled tasks, sending emails (show a draft first and ask "Should I send this?").
- When asked to email someone by name, always look up their contact info first before composing the email.
- When asked to play music on a streaming service, always search for the track/artist first to get the correct identifier before starting playback.

## Response Style
- Be **concise and direct**. Give short, useful answers. Expand only when asked.
- Address the user as "you" in all responses.
- Use a **friendly, casual tone** — you're a companion, not a corporate bot.
- Use emoji sparingly but effectively ✨ — for headings, status indicators, and personality.

## Formatting Rules
- Always respond in **clean, beautiful Markdown**.
- Use **tables** for structured data (weather, specs, contacts, search results, etc.).
- Format math using $...$ for inline and $$...$$ for block equations.
- Diagrams (Graphviz/DOT): Render compact, modern diagrams (rounded nodes, pastel colors, Helvetica font, light grey edges, fit for display). Keep description to one line.
- Authorization/OAuth links: Always render as clickable hyperlinks → [Authorize here](url).
- Keep token usage low. Be efficient.`,
		});

		return agent;
	}

	// Dynamic summaryModel method
	async getSummaryModel() {
		if (!this.state.provider || !this.state.summaryModel) {
			throw new Error(
				`AI model not initialized. Provider: ${this.state.provider}, SummaryModel: ${this.state.summaryModel}`,
			);
		}

		if (this.state.provider === "groq") {
			return groq(this.state.summaryModel.id);
		} else if (this.state.provider === "google") {
			return google(this.state.summaryModel.id);
		} else {
			throw new Error(`Unsupported provider: ${this.state.provider}`);
		}
	}

	// Get current state
	getState() {
		return {
			provider: this.state.provider,
			chatModel: this.state.chatModel,
			summaryModel: this.state.summaryModel,
			providers: this.state.providers,
			envStore: this.state.envStore, // Include envStore in state
		};
	}

	// Methods for store.aiConfig (renamed from apiConfig)
	setAiConfig(key, value) {
		const aiConfig = resolveStore().get("aiConfig") || {};
		aiConfig[key] = value;
		resolveStore().set("aiConfig", aiConfig);
	}

	getAiConfig(key) {
		const aiConfig = resolveStore().get("aiConfig") || {};
		return aiConfig[key];
	}

	deleteAiConfig(key) {
		const aiConfig = resolveStore().get("aiConfig") || {};
		delete aiConfig[key];
		resolveStore().set("aiConfig", aiConfig);
	}

	// Methods for store.aiConfig.envStore
	setEnvStore(envData) {
		let aiConfig = resolveStore().get("aiConfig") || {};
		if (!aiConfig.envStore) aiConfig.envStore = {};
		if (!this.state.envStore) this.state.envStore = {};

		// envData can be { provider: { key: value, ... }, ... } or legacy { key: value, ... }
		if (typeof envData === "object" && envData !== null) {
			// Check if it's nested (has provider keys)
			const isNested = Object.values(envData).some(
				(value) => typeof value === "object" && value !== null,
			);
			if (isNested) {
				// Nested: { provider: { key: value } }
				for (const [provider, keys] of Object.entries(envData)) {
					if (!aiConfig.envStore[provider])
						aiConfig.envStore[provider] = {};
					if (!this.state.envStore[provider])
						this.state.envStore[provider] = {};
					for (const [key, value] of Object.entries(keys)) {
						aiConfig.envStore[provider][key] = value;
						this.state.envStore[provider][key] = value;
						if (value !== null && value !== undefined) {
							process.env[key] = value;
						}
					}
				}
			} else {
				// Legacy flat: { key: value }
				for (const [key, value] of Object.entries(envData)) {
					// Find which provider this key belongs to
					let providerName = null;
					for (const [prov, provData] of Object.entries(
						this.state.providers,
					)) {
						if (provData.env_var === key) {
							providerName = prov;
							break;
						}
					}
					if (providerName) {
						if (!aiConfig.envStore[providerName])
							aiConfig.envStore[providerName] = {};
						if (!this.state.envStore[providerName])
							this.state.envStore[providerName] = {};
						aiConfig.envStore[providerName][key] = value;
						this.state.envStore[providerName][key] = value;
					}
					if (value !== null && value !== undefined) {
						process.env[key] = value;
					}
				}
			}
		} else {
			// Legacy single
			const [key, value] = arguments;
			// Find provider
			let providerName = null;
			for (const [prov, provData] of Object.entries(
				this.state.providers,
			)) {
				if (provData.env_var === key) {
					providerName = prov;
					break;
				}
			}
			if (providerName) {
				if (!aiConfig.envStore[providerName])
					aiConfig.envStore[providerName] = {};
				if (!this.state.envStore[providerName])
					this.state.envStore[providerName] = {};
				aiConfig.envStore[providerName][key] = value;
				this.state.envStore[providerName][key] = value;
			}
			if (value !== null && value !== undefined) {
				process.env[key] = value;
			}
		}

		resolveStore().set("aiConfig", aiConfig);
	}

	getEnvStore(key) {
		if (this.state.envStore) {
			// Search across all providers
			for (const provider of Object.values(this.state.envStore)) {
				if (
					provider &&
					typeof provider === "object" &&
					key in provider
				) {
					return provider[key];
				}
			}
		}
		return null;
	}

	deleteEnvStore(key) {
		let aiConfig = resolveStore().get("aiConfig") || {};
		if (aiConfig.envStore) {
			// Find and delete from the correct provider
			for (const [providerName, providerKeys] of Object.entries(
				aiConfig.envStore,
			)) {
				if (
					providerKeys &&
					typeof providerKeys === "object" &&
					key in providerKeys
				) {
					delete aiConfig.envStore[providerName][key];
					resolveStore().set("aiConfig", aiConfig);
					break;
				}
			}
		}
		// Update state (triggers emit)
		if (this.state.envStore) {
			for (const [providerName, providerKeys] of Object.entries(
				this.state.envStore,
			)) {
				if (
					providerKeys &&
					typeof providerKeys === "object" &&
					key in providerKeys
				) {
					delete this.state.envStore[providerName][key];
					break;
				}
			}
		}
		// Also remove from process.env
		delete process.env[key];
	}
}

export const aiModel = new AIModel();
