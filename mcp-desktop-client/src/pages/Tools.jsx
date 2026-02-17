import React, { useEffect, useState } from "react";
import { useMcpStore } from "../store/mcpStore";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { RefreshCw, Plus, Plug, Unplug, Power } from "lucide-react";
import { ServerCard } from "../components/tools/ServerCard";
import { AddServerDialog } from "../components/tools/AddServerDialog";
import { ViewToolsDialog } from "../components/tools/ViewToolsDialog";
import { ServerSettingsDialog } from "../components/tools/ServerSettingsDialog";

function Tools() {
	const {
		mcpServers,
		activeTools,
		isConnected,
		isConnecting,
		init,
		connectToServers,
		disconnectFromServers,
		readConfig,
		forceReinitialize,
		listenForUpdates,
		cleanup,
	} = useMcpStore();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [viewToolsDialog, setViewToolsDialog] = useState({
		open: false,
		serverName: null,
		serverData: null,
	});
	const [settingsDialog, setSettingsDialog] = useState({
		open: false,
		serverName: null,
		serverData: null,
	});

	useEffect(() => {
		init();
		listenForUpdates();

		return () => {
			cleanup();
		};
	}, [init, listenForUpdates, cleanup]);

	const handleConnect = async () => {
		await connectToServers();
	};

	const handleDisconnect = async () => {
		await disconnectFromServers();
	};

	const handleRefresh = async () => {
		await readConfig();
		await forceReinitialize();
	};

	const handleViewTools = (serverName, serverData) => {
		setViewToolsDialog({ open: true, serverName, serverData });
	};

	const handleSettings = (serverName, serverData) => {
		setSettingsDialog({ open: true, serverName, serverData });
	};

	const serverEntries = Object.entries(mcpServers);
	const totalTools = activeTools.length;

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">MCP Tools</h1>
					<p className="text-muted-foreground">
						Manage your Model Context Protocol servers and tools
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-lg px-4 py-2">
						{totalTools} {totalTools === 1 ? "Tool" : "Tools"}
					</Badge>
					<Button
						onClick={handleRefresh}
						variant="outline"
						size="icon"
					>
						<RefreshCw className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Control Buttons */}
			<div className="flex items-center gap-3">
				<Button
					onClick={handleConnect}
					disabled={isConnecting || isConnected}
					className="gap-2"
				>
					<Plug className="h-4 w-4" />
					{isConnecting ? "Connecting..." : "Connect All"}
				</Button>
				<Button
					onClick={handleDisconnect}
					disabled={!isConnected}
					variant="destructive"
					className="gap-2"
				>
					<Unplug className="h-4 w-4" />
					Disconnect All
				</Button>
				<Button
					variant="outline"
					className="gap-2"
					onClick={() => setAddDialogOpen(true)}
				>
					<Plus className="h-4 w-4" />
					Add Server
				</Button>
			</div>

			{/* Server Grid */}
			{serverEntries.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground text-lg mb-4">
							No servers connected
						</p>
						<Button onClick={handleConnect} className="gap-2">
							<Power className="h-4 w-4" />
							Connect to Servers
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{serverEntries.map(([serverName, serverData]) => (
						<ServerCard
							key={serverName}
							serverName={serverName}
							serverData={serverData}
							onViewTools={handleViewTools}
							onSettings={handleSettings}
						/>
					))}
				</div>
			)}

			{/* Dialogs */}
			<AddServerDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
			/>
			<ViewToolsDialog
				open={viewToolsDialog.open}
				onOpenChange={(open) =>
					setViewToolsDialog({ ...viewToolsDialog, open })
				}
				serverName={viewToolsDialog.serverName}
				serverData={viewToolsDialog.serverData}
			/>
			<ServerSettingsDialog
				open={settingsDialog.open}
				onOpenChange={(open) =>
					setSettingsDialog({ ...settingsDialog, open })
				}
				serverName={settingsDialog.serverName}
				serverData={settingsDialog.serverData}
			/>
		</div>
	);
}

export default Tools;
