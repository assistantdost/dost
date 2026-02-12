// Example: MCP Server Management Component
// File: mcp-desktop-client/src/pages/McpSettings.jsx

import React, { useEffect, useState } from "react";
import { useMcpStore } from "@/store/mcpStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plug, Unplug } from "lucide-react";

export default function McpSettings() {
	const {
		serverConfig,
		mcpServers,
		activeTools,
		isConnecting,
		isConnected,
		readConfig,
		updateServerInConfig,
		connectToServers,
		disconnectFromServers,
	} = useMcpStore();

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadConfig = async () => {
			await readConfig();
			setLoading(false);
		};
		loadConfig();
	}, [readConfig]);

	const handleToggleServer = async (serverName, currentState) => {
		await updateServerInConfig(serverName, { enabled: !currentState });
	};

	const handleReconnect = async () => {
		await disconnectFromServers();
		await connectToServers();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">MCP Server Settings</h1>
				<div className="flex gap-2">
					<Button
						onClick={handleReconnect}
						disabled={isConnecting}
						variant="outline"
					>
						{isConnecting ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : (
							<Plug className="h-4 w-4 mr-2" />
						)}
						Reconnect
					</Button>
					<Button
						onClick={disconnectFromServers}
						disabled={!isConnected}
						variant="destructive"
					>
						<Unplug className="h-4 w-4 mr-2" />
						Disconnect All
					</Button>
				</div>
			</div>

			{/* Connection Status */}
			<Card>
				<CardHeader>
					<CardTitle>Connection Status</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex justify-between">
							<span>Status:</span>
							<Badge
								variant={isConnected ? "success" : "secondary"}
							>
								{isConnected ? "Connected" : "Disconnected"}
							</Badge>
						</div>
						<div className="flex justify-between">
							<span>Active Tools:</span>
							<span className="font-mono">
								{activeTools.length}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Connected Servers:</span>
							<span className="font-mono">
								{Object.keys(mcpServers).length}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Server List */}
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Configured Servers</h2>
				{Object.entries(serverConfig).map(([name, config]) => {
					const connectedServer = mcpServers[name];
					const isServerConnected = !!connectedServer?.connected;

					return (
						<Card key={name}>
							<CardContent className="pt-6">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="font-semibold">
												{name}
											</h3>
											<Badge
												variant={
													isServerConnected
														? "success"
														: "secondary"
												}
											>
												{isServerConnected
													? "Connected"
													: "Disconnected"}
											</Badge>
											{config.transport && (
												<Badge variant="outline">
													{config.transport}
												</Badge>
											)}
										</div>
										<p className="text-sm text-gray-600 mb-3">
											{config.description ||
												"No description"}
										</p>
										<div className="text-sm space-y-1">
											{config.url && (
												<div className="font-mono text-xs text-gray-500">
													URL: {config.url}
												</div>
											)}
											{config.command && (
												<div className="font-mono text-xs text-gray-500">
													Command: {config.command}{" "}
													{config.args?.join(" ")}
												</div>
											)}
											{connectedServer && (
												<div className="text-xs text-green-600">
													{connectedServer.toolsCount}{" "}
													tools available
												</div>
											)}
										</div>
									</div>
									<Switch
										checked={config.enabled}
										onCheckedChange={() =>
											handleToggleServer(
												name,
												config.enabled,
											)
										}
									/>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Tools List */}
			{activeTools.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>
							Available Tools ({activeTools.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{activeTools.map((tool) => (
								<Badge key={tool} variant="outline">
									{tool}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ============================================
// Example: Using MCP Tools in Chat Component
// ============================================

// In your chat component, tools are automatically available:
import { useMcpStore } from "@/store/mcpStore";

function ChatComponent() {
	const { activeTools, isConnected } = useMcpStore();

	// Tools are already loaded and available to the agent
	// The agent (in electron/ai/agent.js) uses getTools() which
	// automatically includes all tools from connected MCP servers

	return (
		<div>
			{!isConnected && (
				<div className="bg-yellow-50 p-4 rounded-lg">
					⚠️ MCP servers not connected. Some tools may be unavailable.
				</div>
			)}

			{isConnected && (
				<div className="text-sm text-gray-500">
					{activeTools.length} tools available
				</div>
			)}

			{/* Your chat UI */}
		</div>
	);
}

// ============================================
// Example: Adding Custom Server at Runtime
// ============================================

async function addCustomServer() {
	const { addServerToConfig, connectToServers, disconnectFromServers } =
		useMcpStore.getState();

	// Add new server configuration
	await addServerToConfig("custom-api-server", {
		url: "http://api.example.com/mcp",
		transport: "streamable_http",
		headers: {
			Authorization: "Bearer YOUR_API_KEY",
		},
		enabled: true,
		description: "Custom API Server",
	});

	// Reconnect to load the new server
	await disconnectFromServers();
	await connectToServers();

	console.log("Custom server added and connected!");
}

// ============================================
// Example: Programmatic Server Management
// ============================================

import { useMcpStore } from "@/store/mcpStore";

function ServerManager() {
	const store = useMcpStore();

	const handleAddGoogleServer = async () => {
		await store.addServerToConfig("google-services", {
			url: "https://your-google-mcp.example.com/mcp",
			transport: "streamable_http",
			headers: {
				"X-API-KEY": "your-api-key",
			},
			enabled: true,
			description: "Google Calendar & Gmail Integration",
		});

		await store.connectToServers();
	};

	const handleRemoveServer = async (serverName) => {
		if (confirm(`Remove server "${serverName}"?`)) {
			await store.removeServerFromConfig(serverName);
			await store.connectToServers();
		}
	};

	return (
		<div>
			<Button onClick={handleAddGoogleServer}>Add Google Services</Button>
			{/* More server management UI */}
		</div>
	);
}
