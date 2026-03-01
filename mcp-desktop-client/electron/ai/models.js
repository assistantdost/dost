import {
	convertToModelMessages,
	Experimental_Agent as Agent,
	stepCountIs,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";

import store from "../store.js";
import { config } from "../config.js";
import os from "os";

const LLM_MODELS = config.API_URL + "/llm_models";

export class AIModel {
	constructor() {
		this.providers = null;
		this.chatModel = null;
		this.summaryModel = null;
		this.provider = null; // Now stores provider name (string)
		this.systemEnv = {};
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
			this.provider = aiConfig.provider; // Store provider name
			this.chatModel = defaultProvider.models[aiConfig.chatModel];
			this.summaryModel = defaultProvider.models[aiConfig.summaryModel];
		} else {
			// Case 2: Load from aiConfig
			this.provider = aiConfig.provider; // Store provider name
			this.chatModel =
				this.providers[aiConfig.provider].models[aiConfig.chatModel];
			this.summaryModel =
				this.providers[aiConfig.provider].models[aiConfig.summaryModel];
		}

		// Save aiConfig to store
		store.set("aiConfig", aiConfig);

		this.getSystemEnv();
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
		let aiConfig = store.get("aiConfig") || {};
		aiConfig.provider = provider;
		aiConfig.chatModel = model;
		// Optionally set summaryModel to provider's default
		aiConfig.summaryModel = this.providers[provider].summary_model;

		// Update this.*
		this.provider = provider; // Store provider name
		this.chatModel = this.providers[provider].models[model];
		this.summaryModel =
			this.providers[provider].models[aiConfig.summaryModel];

		// Save to store
		store.set("aiConfig", aiConfig);
	}

	// Dynamic chatAgent method
	async chatAgent(tools) {
		// Dynamically select model based on this.provider and this.chatModel
		let model;
		if (this.provider === "groq") {
			model = groq(this.chatModel.id);
		} else if (this.provider === "gemini") {
			model = google(this.chatModel.id);
		} else {
			throw new Error(`Unsupported provider: ${this.provider}`);
		}

		const agent = new Agent({
			model,
			tools: {
				...tools,
				browser_search: groq.tools.browserSearch({}),
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
		if (this.provider === "groq") {
			return groq(this.summaryModel.id);
		} else if (this.provider === "gemini") {
			return google(this.summaryModel.id);
		} else {
			throw new Error(`Unsupported provider: ${this.provider}`);
		}
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
