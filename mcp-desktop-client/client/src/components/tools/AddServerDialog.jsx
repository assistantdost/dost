import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useMcpStore } from "../../store/mcpStore";
import { ServerIcon, Code2 } from "lucide-react";

export function AddServerDialog({ open, onOpenChange }) {
	const { addServer } = useMcpStore();
	const [serverName, setServerName] = useState("");
	const [configJson, setConfigJson] = useState(
		'{\n  "description": "My MCP Server",\n  "transport": "http",\n  "url": "http://localhost:3000",\n  "enabled": true,\n  "headers": {\n    "Authorization": "Bearer your-api-key-here"\n  }\n}',
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		let serverConfig = {};
		try {
			serverConfig = JSON.parse(configJson);
		} catch (error) {
			console.warn("Invalid JSON in config, using empty object");
			alert("Invalid JSON configuration. Please check your syntax.");
			setIsSubmitting(false);
			return;
		}

		// Ensure required fields
		if (!serverConfig.transport) {
			serverConfig.transport = "http";
		}
		if (serverConfig.enabled === undefined) {
			serverConfig.enabled = true;
		}

		const result = await addServer(serverName, serverConfig);

		if (result.success) {
			setServerName("");
			setConfigJson(
				'{\n  "description": "My MCP Server",\n  "transport": "http",\n  "url": "http://localhost:3000",\n  "enabled": true,\n  "headers": {\n    "Authorization": "Bearer your-api-key-here"\n  }\n}',
			);
			onOpenChange(false);
		}

		setIsSubmitting(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ServerIcon className="h-5 w-5" />
						Add MCP Server
					</DialogTitle>
					<DialogDescription>
						Configure a new Model Context Protocol server to expand
						your tool ecosystem.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="basic" className="gap-2">
								<ServerIcon className="h-4 w-4" />
								Basic
							</TabsTrigger>
							<TabsTrigger value="json" className="gap-2">
								<Code2 className="h-4 w-4" />
								JSON Config
							</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="space-y-4 py-4">
							<div className="space-y-2">
								<Label
									htmlFor="serverName"
									className="flex items-center gap-2"
								>
									Server Name *
								</Label>
								<Input
									id="serverName"
									placeholder="e.g., my-mcp-server, production-api"
									value={serverName}
									onChange={(e) =>
										setServerName(e.target.value)
									}
									required
									className="font-mono"
								/>
								<p className="text-xs text-muted-foreground">
									A unique identifier for this server
									configuration
								</p>
							</div>
							<div className="p-4 bg-gradient-to-br from-muted/50 to-muted rounded-lg border">
								<p className="text-sm font-semibold mb-2">
									⚙️ Advanced Configuration
								</p>
								<p className="text-sm text-muted-foreground">
									Switch to the <strong>JSON Config</strong>{" "}
									tab to configure all server settings
									including transport type, endpoint
									URL/command, authentication headers, and
									custom options.
								</p>
							</div>
						</TabsContent>

						<TabsContent value="json" className="space-y-4 py-4">
							<div className="space-y-2">
								<Label
									htmlFor="config"
									className="flex items-center gap-2"
								>
									<Code2 className="h-4 w-4" />
									Server Configuration (JSON)
								</Label>
								<Textarea
									id="config"
									placeholder='{\n  "description": "My MCP Server",\n  "transport": "http",\n  "url": "http://localhost:3000",\n  "enabled": true,\n  "headers": {\n    "Authorization": "Bearer your-api-key-here"\n  }\n}'
									value={configJson}
									onChange={(e) =>
										setConfigJson(e.target.value)
									}
									className="font-mono text-sm bg-muted/50"
									rows={14}
								/>
								<div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
									<span className="text-blue-600 dark:text-blue-400 text-xs">
										ℹ️
									</span>
									<p className="text-xs text-blue-700 dark:text-blue-300">
										Enter the complete server configuration
										as JSON. Supports all MCP server options
										including custom fields, transport
										protocols, and authentication
										mechanisms.
									</p>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Adding..." : "Add Server"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
