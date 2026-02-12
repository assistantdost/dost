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

export function AddServerDialog({ open, onOpenChange }) {
	const { addServerToConfig } = useMcpStore();
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

		const result = await addServerToConfig(serverName, serverConfig);

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
					<DialogTitle>Add MCP Server</DialogTitle>
					<DialogDescription>
						Configure a new Model Context Protocol server.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="basic">Basic</TabsTrigger>
							<TabsTrigger value="json">JSON Config</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="serverName">
									Server Name *
								</Label>
								<Input
									id="serverName"
									placeholder="my-mcp-server"
									value={serverName}
									onChange={(e) =>
										setServerName(e.target.value)
									}
									required
								/>
							</div>
							<div className="p-4 bg-muted rounded-lg">
								<p className="text-sm text-muted-foreground">
									Use the JSON Config tab to configure all
									server settings including transport,
									URL/command, headers, and any custom
									options.
								</p>
							</div>
						</TabsContent>

						<TabsContent value="json" className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="config">
									Server Configuration (JSON)
								</Label>
								<Textarea
									id="config"
									placeholder='{\n  "description": "My MCP Server",\n  "transport": "http",\n  "url": "http://localhost:3000",\n  "enabled": true,\n  "headers": {\n    "Authorization": "Bearer your-api-key-here"\n  }\n}'
									value={configJson}
									onChange={(e) =>
										setConfigJson(e.target.value)
									}
									className="font-mono text-sm"
									rows={12}
								/>
								<p className="text-xs text-muted-foreground">
									Enter the complete server configuration as
									JSON. Supports all MCP server options
									including custom fields.
								</p>
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
