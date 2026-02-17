import React, { useEffect, useState } from "react";
import { useMcpStore } from "../store/mcpStore";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Power, Settings2, Plus, Database } from "lucide-react";
import { ConfigCard } from "@/components/tools/ConfigCard";
import { ToolsServerView } from "@/components/tools/ToolsServerView";
import { AddServerDialog } from "@/components/tools/AddServerDialog";

function Tools() {
	const {
		mcpServers,
		config,
		isMcpConnected,
		toolCount,
		connectAllServers,
		disconnectAllServers,
	} = useMcpStore();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [isPowering, setIsPowering] = useState(false);

	const handlePowerToggle = async () => {
		setIsPowering(true);
		if (isMcpConnected) {
			await disconnectAllServers();
		} else {
			await connectAllServers();
		}
		setIsPowering(false);
	};

	const configEntries = Object.entries(config || {});
	const isSystemOn = Object.keys(mcpServers || {}).length > 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<div className="container mx-auto p-4 space-y-8">
				{/* Header */}
				<div className="space-y-4 md:space-y-2">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-3">
						<div className="space-y-1 text-center md:text-left">
							<h2 className="text-xl font-bold tracking-tight">
								MCP Control Center
							</h2>
							<p className="text-muted-foreground">
								Manage and monitor your Model Context Protocol
								infrastructure
							</p>
						</div>
						<div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-3">
							<div className="flex flex-row items-center gap-1 md:flex-col md:items-end md:gap-1">
								<Badge
									variant={isSystemOn ? "default" : "outline"}
									className="text-xs px-3 py-1"
								>
									<Database className="h-3 w-3 mr-1" />
									{Object.keys(mcpServers || {}).length}{" "}
									{Object.keys(mcpServers || {}).length === 1
										? "Server"
										: "Servers"}
								</Badge>
								<Badge
									variant="outline"
									className="text-xs px-3 py-1"
								>
									{toolCount || 0}{" "}
									{toolCount === 1 ? "Tool" : "Tools"}
								</Badge>
							</div>
							<Button
								variant={isSystemOn ? "destructive" : "default"}
								className="gap-2 min-w-[140px] cursor-pointer"
								onClick={handlePowerToggle}
								disabled={
									isPowering || configEntries.length === 0
								}
							>
								<Power className="h-5 w-5" />
								{isPowering
									? "Processing..."
									: isSystemOn
										? "Power Off"
										: "Power On"}
							</Button>
						</div>
					</div>
				</div>

				<Separator />

				{/* Config Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Settings2 className="h-5 w-5 text-muted-foreground" />
							<h2 className="text-2xl font-semibold">
								Server Configuration
							</h2>
						</div>
						<Button
							variant="outline"
							className="gap-2"
							onClick={() => setAddDialogOpen(true)}
						>
							<Plus className="h-4 w-4" />
							Add Server
						</Button>
					</div>

					{configEntries.length === 0 ? (
						<Card className="border-dashed">
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									No Servers Configured
								</h3>
								<p className="text-muted-foreground text-center mb-4 max-w-sm">
									Get started by adding your first MCP server
									configuration
								</p>
								<Button
									onClick={() => setAddDialogOpen(true)}
									className="gap-2"
								>
									<Plus className="h-4 w-4" />
									Add Your First Server
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{configEntries.map(([serverName, serverConfig]) => (
								<ConfigCard
									key={serverName}
									serverName={serverName}
									serverConfig={serverConfig}
								/>
							))}
						</div>
					)}
				</div>

				<Separator />

				{/* Tools Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Database className="h-5 w-5 text-muted-foreground" />
						<h2 className="text-xl font-semibold">Active Tools</h2>
					</div>

					{Object.keys(mcpServers || {}).length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Power className="h-12 w-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									System Offline
								</h3>
								<p className="text-muted-foreground text-center mb-4 max-w-sm">
									Power on the system to view available tools
									from connected servers
								</p>
								{configEntries.length > 0 && (
									<Button
										onClick={handlePowerToggle}
										className="gap-2"
										disabled={isPowering}
									>
										<Power className="h-4 w-4" />
										Power On System
									</Button>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{Object.entries(mcpServers || {}).map(
								([name, server]) => (
									<ToolsServerView
										key={name}
										serverName={name}
										serverData={server}
									/>
								),
							)}
						</div>
					)}
				</div>
			</div>

			{/* Dialogs */}
			<AddServerDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
			/>
		</div>
	);
}

export default Tools;
