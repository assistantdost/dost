"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
	Terminal, 
	Server, 
	Monitor, 
	Cloud, 
	Code2, 
	Zap, 
	Play, 
	Layers, 
	Settings, 
	ExternalLink 
} from "lucide-react";

export default function McpServersPage() {
	const [activeServer, setActiveServer] = useState("desktop");

	const servers = {
		desktop: {
			title: "Desktop Server",
			icon: <Monitor className="h-5 w-5" />,
			type: "Local (stdio)",
			description: "This is your local action engine. It communicates over stdin/stdout, allowing AI models to execute safe system-level controls and scripting on your computer.",
			setup: "npx -y @dost/desktop-server start",
			tools: [
				{
					name: "open_application",
					description: "Launch desktop applications and open browser URLs.",
					args: { app_name: "string (e.g. 'chrome', 'spotify')", url: "string (optional)" }
				},
				{
					name: "control_system_audio",
					description: "Adjust or mute master audio output volume.",
					args: { volume: "integer (0-100)", mute: "boolean (optional)" }
				},
				{
					name: "take_screenshot",
					description: "Capture the active monitor screen and save it locally.",
					args: { format: "string ('png', 'jpg')" }
				},
				{
					name: "manage_active_window",
					description: "Control app window states (minimize, maximize, focus, close).",
					args: { window_title: "string", action: "string ('minimize', 'maximize', 'focus', 'close')" }
				},
				{
					name: "read_clipboard",
					description: "Retrieve plain text currently copied to the system clipboard.",
					args: {}
				},
				{
					name: "run_shell_script",
					description: "Execute a validated command-line script in a controlled sandbox.",
					args: { script: "string", timeout: "integer (ms)" }
				}
			]
		},
		remote: {
			title: "Remote Server",
			icon: <Cloud className="h-5 w-5" />,
			type: "Cloud (WebSockets / SSE)",
			description: "This is your cloud integration gateway. It connects your AI model with live information APIs and authorized online accounts using OAuth2 authentication.",
			setup: "npx -y @dost/remote-server start --port 8080",
			tools: [
				{
					name: "fetch_gmail_inbox",
					description: "Retrieve recent email messages, sender metadata, and unread threads.",
					args: { max_results: "integer (1-50)", unread_only: "boolean" }
				},
				{
					name: "create_calendar_event",
					description: "Schedule bookings and add agenda details directly to Google Calendar.",
					args: { title: "string", start_time: "ISO Date", end_time: "ISO Date", description: "string (optional)" }
				},
				{
					name: "spotify_playback_control",
					description: "Toggle playback state or skip songs in your active queue.",
					args: { state: "string ('play', 'pause', 'next', 'previous')", volume: "integer (optional)" }
				},
				{
					name: "spotify_device_swap",
					description: "Transfer active Spotify playback stream to a different authorized device.",
					args: { device_id: "string" }
				},
				{
					name: "fetch_market_quote",
					description: "Get real-time market indices, stock tickers, or cryptocurrency quotes.",
					args: { symbol: "string (e.g. 'TSLA', 'BTCUSD')" }
				},
				{
					name: "fetch_weather",
					description: "Get current conditions and forecasts for a specified global city.",
					args: { city: "string" }
				}
			]
		}
	};

	const currentServer = servers[activeServer];

	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-5xl space-y-8">
				{/* Top Header */}
				<div className="text-center md:text-left border-b border-border/60 pb-6">
					<Badge variant="outline" className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full">
						Infrastructure
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">MCP Servers Explorer</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Browse pre-configured tools, schemas, and configurations built on the Model Context Protocol.
					</p>
				</div>

				{/* Selection Tabs */}
				<div className="flex bg-muted/40 border border-border p-1.5 rounded-xl max-w-md mx-auto md:mx-0">
					<button
						onClick={() => setActiveServer("desktop")}
						className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
							activeServer === "desktop"
								? "bg-primary text-primary-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
						}`}
					>
						<Monitor className="h-4 w-4" />
						Desktop Server
					</button>
					<button
						onClick={() => setActiveServer("remote")}
						className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
							activeServer === "remote"
								? "bg-primary text-primary-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/40"
						}`}
					>
						<Cloud className="h-4 w-4" />
						Remote Server
					</button>
				</div>

				{/* Server details */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* Left panel: Info & Config */}
					<div className="lg:col-span-5 space-y-6">
						<Card className="border-border bg-card shadow-sm">
							<CardHeader className="flex flex-row items-center gap-3">
								<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center">
									{currentServer.icon}
								</div>
								<div>
									<CardTitle className="text-base">{currentServer.title}</CardTitle>
									<CardDescription className="text-xs uppercase font-bold text-primary mt-0.5 tracking-wide">
										{currentServer.type}
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
									{currentServer.description}
								</p>

								{/* Setup Code */}
								<div className="space-y-2 pt-2">
									<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Terminal Startup Command</span>
									<div className="flex items-center gap-2 border border-border/80 rounded-lg p-3 bg-muted/40 font-mono text-xs select-all text-foreground break-all relative">
										<Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
										<span>{currentServer.setup}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Quick Client Compatibility checklist */}
						<Card className="border-border bg-card shadow-sm">
							<CardHeader>
								<CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Compatibility Matrix</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 pt-0">
								<div className="flex justify-between items-center text-xs">
									<span className="text-muted-foreground">DOST Desktop App</span>
									<Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 rounded-full font-bold">Native</Badge>
								</div>
								<div className="flex justify-between items-center text-xs">
									<span className="text-muted-foreground">Cursor Code Editor</span>
									<Badge variant="outline" className="text-primary border-primary rounded-full font-bold">Compatible</Badge>
								</div>
								<div className="flex justify-between items-center text-xs">
									<span className="text-muted-foreground">Claude Desktop Client</span>
									<Badge variant="outline" className="text-primary border-primary rounded-full font-bold">Compatible</Badge>
								</div>
								<div className="flex justify-between items-center text-xs">
									<span className="text-muted-foreground">Custom stdio Clients</span>
									<Badge variant="outline" className="text-muted-foreground border-border rounded-full font-bold">Supported</Badge>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right panel: Available Tools */}
					<div className="lg:col-span-7 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
								Packaged Tools ({currentServer.tools.length})
							</h3>
							<Badge className="bg-primary/10 border-primary text-primary font-bold">
								MCP Standard 1.0
							</Badge>
						</div>

						<div className="space-y-4">
							{currentServer.tools.map((tool) => (
								<Card key={tool.name} className="border-border bg-card shadow-sm hover:border-primary/45 transition-colors duration-200">
									<CardHeader className="py-4 pb-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<code className="text-xs font-bold text-primary font-sans">
												{tool.name}
											</code>
											<span className="text-[10px] text-muted-foreground font-semibold font-mono">
												tool schema
											</span>
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											{tool.description}
										</p>
									</CardHeader>
									{Object.keys(tool.args).length > 0 && (
										<CardContent className="py-3 pt-0 border-t border-border/40 mt-2 bg-muted/10">
											<div className="space-y-1.5 pt-2">
												<span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Input Arguments</span>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
													{Object.entries(tool.args).map(([argName, argType]) => (
														<div key={argName} className="flex justify-between items-center border border-border/60 rounded-md p-1.5 bg-background text-[10px]">
															<span className="font-bold text-foreground">{argName}</span>
															<span className="text-muted-foreground font-mono">{argType}</span>
														</div>
													))}
												</div>
											</div>
										</CardContent>
									)}
								</Card>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
