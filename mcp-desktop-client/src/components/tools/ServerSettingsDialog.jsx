// This component is deprecated - settings are now handled in ConfigCard
export function ServerSettingsDialog() {
	return null;
}

export function ServerSettingsDialog({
	open,
	onOpenChange,
	serverName,
	serverData,
}) {
	const { updateServerInConfig, removeServerFromConfig, serverConfig } =
		useMcpStore();
	const [description, setDescription] = useState("");
	const [enabled, setEnabled] = useState(true);
	const [url, setUrl] = useState("");
	const [configJson, setConfigJson] = useState(
		'{\n  "description": "My MCP Server",\n  "transport": "http",\n  "enabled": true\n}',
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (serverName && serverConfig[serverName]) {
			const config = serverConfig[serverName];
			setDescription(config.description || "");
			setEnabled(config.enabled !== false);
			setUrl(config.url || "");
			setConfigJson(JSON.stringify(config, null, 2));
		}
	}, [serverName, serverConfig]);

	const handleSave = async () => {
		setIsSubmitting(true);

		let serverConfigUpdate = {};
		try {
			serverConfigUpdate = JSON.parse(configJson);
		} catch (error) {
			console.warn("Invalid JSON in config, using current config");
			alert("Invalid JSON configuration. Please check your syntax.");
			setIsSubmitting(false);
			return;
		}

		// Ensure required fields
		if (serverConfigUpdate.enabled === undefined) {
			serverConfigUpdate.enabled = true;
		}

		await updateServerInConfig(serverName, serverConfigUpdate);
		setIsSubmitting(false);
		onOpenChange(false);
	};

	const handleDelete = async () => {
		if (confirm(`Are you sure you want to remove "${serverName}"?`)) {
			await removeServerFromConfig(serverName);
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{serverName} - Settings</DialogTitle>
					<DialogDescription>
						Configure server settings and connection
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="settings" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="settings">Settings</TabsTrigger>
						<TabsTrigger value="json">JSON Config</TabsTrigger>
					</TabsList>

					<TabsContent value="settings" className="space-y-4 py-4">
						<div className="flex items-center justify-between space-x-2">
							<div className="space-y-0.5">
								<Label>Enable Server</Label>
								<div className="text-sm text-muted-foreground">
									When enabled, this server will connect
									automatically
								</div>
							</div>
							<Switch
								checked={enabled}
								onCheckedChange={setEnabled}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								placeholder="What does this server do?"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						{serverData?.metadata?.transport !== "stdio" && (
							<div className="space-y-2">
								<Label htmlFor="url">URL</Label>
								<Input
									id="url"
									placeholder="http://localhost:3000"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label>Connection Info</Label>
							<div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Transport:
									</span>
									<span>
										{serverData?.metadata?.transport ||
											"N/A"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Tools:
									</span>
									<span>{serverData?.toolsCount || 0}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Status:
									</span>
									<span>
										{serverData?.connected
											? "Connected"
											: "Disconnected"}
									</span>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="json" className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="config">
								Server Configuration (JSON)
							</Label>
							<Textarea
								id="config"
								placeholder='{\n  "description": "My MCP Server",\n  "transport": "stdio",\n  "command": "python",\n  "args": ["server.py"],\n  "enabled": true,\n  "headers": {\n    "Authorization": "Bearer your-api-key-here"\n  },\n  "customField": "any value"\n}'
								value={configJson}
								onChange={(e) => setConfigJson(e.target.value)}
								className="font-mono text-sm"
								rows={12}
							/>
							<p className="text-xs text-muted-foreground">
								Edit the complete server configuration as JSON.
								Supports all MCP server options including custom
								fields.
							</p>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter className="flex justify-between">
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						className="gap-2"
					>
						<AlertCircle className="h-4 w-4" />
						Remove Server
					</Button>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
