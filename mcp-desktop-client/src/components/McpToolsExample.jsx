// Example component showing how to use the MCP store

import React from "react";
import { useMcpStore } from "@/store/mcpStore";
import { Button } from "@/components/ui/button";

export default function McpToolsExample() {
	const {
		mcpServers,
		activeTools,
		getAllTools,
		setActiveTools,
		init,
		isInitialized,
	} = useMcpStore();

	const allTools = getAllTools();

	const handleRefresh = async () => {
		console.log("🔄 Manual refresh triggered");
		await init();
	};

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">MCP Servers & Tools</h2>
				<Button onClick={handleRefresh} size="sm" variant="outline">
					🔄 Refresh
				</Button>
			</div>

			{Object.keys(mcpServers).length === 0 && (
				<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
					<p className="text-sm text-yellow-800">
						No MCP servers connected yet. Tools will load when the
						chat agent is first used, or click Refresh to load them
						now.
					</p>
				</div>
			)}

			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-2">
					Connected Servers
				</h3>
				{Object.entries(mcpServers).map(([name, server]) => (
					<div key={name} className="mb-4 p-3 border rounded">
						<div className="flex items-center gap-2">
							<span
								className={`w-2 h-2 rounded-full ${server.connected ? "bg-green-500" : "bg-red-500"}`}
							/>
							<h4 className="font-semibold">{name}</h4>
						</div>
						<p className="text-sm text-gray-600 mt-1">
							{server.metadata?.type === "http"
								? server.metadata.url
								: "Local Server"}
						</p>
						<p className="text-sm mt-1">
							Tools:{" "}
							{server.toolsCount ||
								(Array.isArray(server.tools)
									? server.tools.length
									: 0)}
						</p>
					</div>
				))}
			</div>

			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-2">Available Tools</h3>
				<div className="flex flex-wrap gap-2">
					{allTools.length > 0 ? (
						allTools.map((toolName) => (
							<span
								key={toolName}
								className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
							>
								{toolName}
							</span>
						))
					) : (
						<p className="text-sm text-gray-500">
							No tools available
						</p>
					)}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-semibold mb-2">Active Tools</h3>
				<p className="text-sm text-gray-600">
					{activeTools.length > 0
						? activeTools.join(", ")
						: "No active tools"}
				</p>
			</div>
		</div>
	);
}
