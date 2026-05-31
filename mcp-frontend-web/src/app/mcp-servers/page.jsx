"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
	Monitor, 
	Cloud, 
	ChevronDown, 
	ChevronUp,
	Cpu,
	Settings2
} from "lucide-react";

export default function McpServersPage() {
	const [expandedDesktopTool, setExpandedDesktopTool] = useState(null);
	const [expandedRemoteTool, setExpandedRemoteTool] = useState(null);

	const toggleDesktopTool = (name) => {
		setExpandedDesktopTool(prev => prev === name ? null : name);
	};

	const toggleRemoteTool = (name) => {
		setExpandedRemoteTool(prev => prev === name ? null : name);
	};

	const desktopTools = [
		{
			name: "get_time",
			description: "Retrieves the current local time for a specific location, city, or timezone. Use this to check 'What time is it in Tokyo?' or system time.",
			args: { location: "string (optional)" }
		},
		{
			name: "list_open_windows",
			description: "Lists the window titles of all currently visible application windows running on the user's desktop.",
			args: {}
		},
		{
			name: "focus_window",
			description: "Brings an open application window to the foreground and focuses it using its title.",
			args: { title: "string (required)" }
		},
		{
			name: "minimize_window",
			description: "Minimizes a target application window to the taskbar.",
			args: { title: "string (required)" }
		},
		{
			name: "maximize_window",
			description: "Maximizes a target application window to fill the screen.",
			args: { title: "string (required)" }
		},
		{
			name: "close_window",
			description: "Closes a specific application window.",
			args: { title: "string (required)" }
		},
		{
			name: "schedule_task",
			description: "Creates an automated background task in Windows Task Scheduler.",
			args: { task_name: "string (required)", command: "string (required)", time_str: "string (required)", date_str: "string (optional)" }
		},
		{
			name: "list_scheduled_tasks",
			description: "Lists technical background jobs and automation scripts scheduled in the Windows Task Scheduler.",
			args: { filter_name: "string (optional)" }
		},
		{
			name: "delete_scheduled_task",
			description: "Permanently deletes a scheduled task from the Windows Task Scheduler.",
			args: { task_name: "string (required)" }
		},
		{
			name: "set_reminder",
			description: "Registers a timer that displays a desktop notification when the duration expires.",
			args: { time_string: "string (required)", message: "string (required)" }
		},
		{
			name: "get_system_info",
			description: "Gathers software and hardware specifications, including operating system name and version, CPU model, CPU cores, active memory usage (RAM), and disk drive capacities.",
			args: {}
		},
		{
			name: "open_app",
			description: "Opens a Windows application using the smart resolver.",
			args: { app_name: "string (required)" }
		},
		{
			name: "open_webpage",
			description: "Opens a URL in the system's default web browser.",
			args: { url: "string (required)" }
		},
		{
			name: "play_song",
			description: "Opens the default browser and plays a song search query on YouTube.",
			args: { song: "string (required)" }
		},
		{
			name: "volume_control",
			description: "Modifies system master audio volume.",
			args: { action: "SET | INCREASE | DECREASE (required)", value: "integer (optional)" }
		},
		{
			name: "brightness_control",
			description: "Modifies target screen brightness percentage.",
			args: { action: "SET | INCREASE | DECREASE (required)", value: "integer (optional)" }
		},
		{
			name: "system_power",
			description: "Controls Windows system power state commands.",
			args: { action: "shutdown | restart | hibernate | lock (required)" }
		},
		{
			name: "create_note",
			description: "Writes new text files safely to the user's isolated note directory (%USERPROFILE%\\Documents\\MCP_Notes).",
			args: { content: "string (required)", custom_filename: "string (optional)" }
		},
		{
			name: "find_files",
			description: "Recursively searches for files or folders matching a query within an allowed start directory.",
			args: { query: "string (required)", start_directory: "string (required)" }
		},
		{
			name: "screenshot",
			description: "Captures the current visible state of the primary display screen and writes it to a file.",
			args: {}
		},
		{
			name: "clipboard_manager",
			description: "Reads (GET) or updates (SET) system clipboard contents.",
			args: { action: "GET | SET (required)", text_to_set: "string (optional)" }
		},
		{
			name: "show_notification",
			description: "Displays a native Windows toast notification popup on the host.",
			args: { title: "string (required)", message: "string (required)", duration_seconds: "integer (optional)" }
		},
		{
			name: "basic_math",
			description: "Evaluates basic list-based arithmetic operators.",
			args: { numbers: "array of floats (required)", operation: "sum | product | min | max | power | factorial | modulo | percentage (required)" }
		},
		{
			name: "evaluate_expression",
			description: "Parses and evaluates complex mathematical expression strings using a secure Abstract Syntax Tree (AST) evaluator.",
			args: { expression: "string (required)" }
		},
		{
			name: "statistics_calc",
			description: "Computes statistical values from lists of numerical values.",
			args: { numbers: "array of floats (required)", operation: "mean | median | mode | stdev | variance | range (required)" }
		},
		{
			name: "unit_converter",
			description: "Performs linear conversions between standard units. Auto-detects physical properties category.",
			args: { value: "float (required)", from_unit: "string (required)", to_unit: "string (required)" }
		},
		{
			name: "date_calculator",
			description: "Performs calendar math calculations using YYYY-MM-DD ISO formatting.",
			args: { operation: "today | days_between | add_days | day_of_week (required)", date1: "string (optional)", date2: "string (optional)", days: "integer (optional)" }
		},
		{
			name: "base_converter",
			description: "Converts input numbers from a source numeral base to a target base.",
			args: { number: "string (required)", from_base: "dec | bin | oct | hex (required)", to_base: "dec | bin | oct | hex (required)" }
		},
		{
			name: "search_web",
			description: "Executes search queries on DuckDuckGo and fetches the top results, returning titles, links, snippets, and truncated webpage contents.",
			args: { query: "string (required)", num_results: "integer (optional)", max_chars_per_page: "integer (optional)" }
		},
		{
			name: "scrape_webpage",
			description: "Downloads and extracts clean text (formatted in Markdown) from any public webpage URL using Trafilatura or BeautifulSoup.",
			args: { url: "string (required)" }
		}
	];

	const remoteTools = [
		{
			name: "get_weather",
			description: "Retrieves the current weather forecast for a specific location. Use this to check temperature, wind, humidity, or precipitation conditions.",
			args: { city: "string (required)", units: "string (optional)" }
		},
		{
			name: "get_stock_data",
			description: "Fetches real-time equity quote data from NSE India (for Indian stocks) or NASDAQ (for international equities). Includes current price, net change, and volume.",
			args: { stock_name: "string (required)" }
		},
		{
			name: "get_crypto_price",
			description: "Fetches real-time cryptocurrency price, market cap rank, supply details, and 24h/7d change statistics using the CoinGecko API.",
			args: { coin_name: "string (required)" }
		},
		{
			name: "get_crypto_history",
			description: "Retrieves historical coin price points for charting purposes.",
			args: { coin_name: "string (required)", period: "string (optional)", currency: "string (optional)" }
		},
		{
			name: "get_metal_price",
			description: "Fetches current spot prices for precious metals (Gold, Silver, Platinum, Palladium) per troy ounce. Converts prices to USD and INR.",
			args: { metal_name: "string (required)" }
		},
		{
			name: "convert_currency",
			description: "Performs currency conversions using live European Central Bank exchange rates retrieved from the Frankfurter API.",
			args: { amount: "float (required)", from_currency: "string (required)", to_currency: "string (required)" }
		},
		{
			name: "read_recent_emails",
			description: "Retrieves recent email metadata (sender, subject, snippet) from the user's Gmail inbox.",
			args: { max_results: "integer (optional)", query: "string (optional)" }
		},
		{
			name: "send_email",
			description: "Composes and sends a new plaintext email from the user's Gmail account.",
			args: { to: "string (required)", subject: "string (required)", body: "string (required)" }
		},
		{
			name: "list_calendar_events",
			description: "Retrieves upcoming events, meetings, and agendas from the user's primary Google Calendar.",
			args: { max_results: "integer (optional)" }
		},
		{
			name: "create_calendar_event",
			description: "Schedules a new appointment, booking, or event on the user's calendar.",
			args: { summary: "string (required)", start_datetime: "string (required)", end_datetime: "string (required)", time_zone: "string (optional)", attendees: "array of strings (optional)", description: "string (optional)" }
		},
		{
			name: "list_contacts",
			description: "Searches the user's Google Contacts address book to retrieve contact names, emails, and phone numbers.",
			args: { query: "string (optional)", max_results: "integer (optional)" }
		},
		{
			name: "get_current_playback",
			description: "Checks the active Spotify session and returns the current track title, artist name, album name, device name, URI, and URL.",
			args: {}
		},
		{
			name: "list_spotify_devices",
			description: "Lists all available Spotify Connect devices (computers, phones, smart speakers) along with their active statuses and unique device IDs.",
			args: {}
		},
		{
			name: "set_spotify_device",
			description: "Transfers media playback from the current device to a selected target device.",
			args: { device_id: "string (required)", play: "boolean (optional)" }
		},
		{
			name: "play_spotify",
			description: "Resumes playback on the currently active Spotify device.",
			args: {}
		},
		{
			name: "pause_spotify",
			description: "Pauses playback on the currently active Spotify device.",
			args: {}
		},
		{
			name: "next_track_spotify",
			description: "Skips forward to the next track in the user's playback queue.",
			args: {}
		},
		{
			name: "previous_track_spotify",
			description: "Goes back to the previous track in the user's playback history.",
			args: {}
		},
		{
			name: "start_spotify_playback",
			description: "Starts playing a specific album, artist, playlist, or track list on the active device.",
			args: { context_uri: "string (optional)", uris: "array of strings (optional)" }
		},
		{
			name: "search_spotify",
			description: "Searches the Spotify catalog for matching media objects.",
			args: { query: "string (required)", search_type: "string (optional)", limit: "integer (optional)" }
		}
	];

	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-6xl space-y-8">
				{/* Top Header */}
				<div className="text-left border-b border-border/60 pb-6 flex items-center justify-between">
					<div>
						<Badge variant="outline" className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full">
							Infrastructure
						</Badge>
						<h1 className="text-3xl font-bold tracking-tight">MCP Control Center</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Manage and monitor your Model Context Protocol infrastructure
						</p>
					</div>
					<div className="hidden sm:flex items-center gap-3">
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-bold text-muted-foreground">
							<Cpu className="h-3.5 w-3.5" /> 2 Servers
						</div>
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-bold text-muted-foreground">
							<Settings2 className="h-3.5 w-3.5" /> 50 Tools
						</div>
					</div>
				</div>

				{/* Active Tools Section */}
				<div className="space-y-6">
					<div className="flex items-center justify-between border-b border-border pb-3">
						<h2 className="text-lg font-bold tracking-tight">Active Tools</h2>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Desktop Server Accordion Card */}
						<Card className="border-border bg-card flex flex-col h-[600px] overflow-hidden shadow-sm">
							<CardHeader className="border-b border-border bg-muted/10 py-4 flex flex-row items-center justify-between shrink-0">
								<div className="flex items-center gap-2">
									<Monitor className="h-5 w-5 text-primary shrink-0" />
									<CardTitle className="text-sm font-bold font-mono">desktop_server</CardTitle>
								</div>
								<Badge className="bg-primary/10 border-primary text-primary text-xs font-bold">
									30 Tools
								</Badge>
							</CardHeader>
							<CardContent className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
								{desktopTools.map((tool) => {
									const isExpanded = expandedDesktopTool === tool.name;
									return (
										<div 
											key={tool.name} 
											className="border border-border/80 rounded-xl overflow-hidden bg-background/50 hover:border-primary/20 transition-all"
										>
											{/* Accordion Trigger */}
											<button
												onClick={() => toggleDesktopTool(tool.name)}
												className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold hover:bg-muted/10 transition-colors"
											>
												<code className="text-xs font-bold font-sans bg-muted border border-border/60 px-2 py-0.5 rounded text-primary">
													{tool.name}
												</code>
												{isExpanded ? (
													<ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
												) : (
													<ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
												)}
											</button>

											{/* Accordion Content */}
											{isExpanded && (
												<div className="p-4 border-t border-border bg-muted/5 text-xs text-muted-foreground leading-relaxed space-y-3 animate-in fade-in duration-200">
													<p>{tool.description}</p>
													{Object.keys(tool.args).length > 0 && (
														<div className="space-y-2 pt-2 border-t border-border/60">
															<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Input Arguments</span>
															<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
																{Object.entries(tool.args).map(([argName, argType]) => (
																	<div key={argName} className="flex justify-between items-center border border-border/60 rounded-lg p-2 bg-background text-[10px]">
																		<span className="font-bold text-foreground">{argName}</span>
																		<span className="text-muted-foreground font-mono">{argType}</span>
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</CardContent>
						</Card>

						{/* Remote Server Accordion Card */}
						<Card className="border-border bg-card flex flex-col h-[600px] overflow-hidden shadow-sm">
							<CardHeader className="border-b border-border bg-muted/10 py-4 flex flex-row items-center justify-between shrink-0">
								<div className="flex items-center gap-2">
									<Cloud className="h-5 w-5 text-primary shrink-0" />
									<CardTitle className="text-sm font-bold font-mono">remote_server</CardTitle>
								</div>
								<Badge className="bg-primary/10 border-primary text-primary text-xs font-bold">
									20 Tools
								</Badge>
							</CardHeader>
							<CardContent className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
								{remoteTools.map((tool) => {
									const isExpanded = expandedRemoteTool === tool.name;
									return (
										<div 
											key={tool.name} 
											className="border border-border/80 rounded-xl overflow-hidden bg-background/50 hover:border-primary/20 transition-all"
										>
											{/* Accordion Trigger */}
											<button
												onClick={() => toggleRemoteTool(tool.name)}
												className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold hover:bg-muted/10 transition-colors"
											>
												<code className="text-xs font-bold font-sans bg-muted border border-border/60 px-2 py-0.5 rounded text-primary">
													{tool.name}
												</code>
												{isExpanded ? (
													<ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
												) : (
													<ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
												)}
											</button>

											{/* Accordion Content */}
											{isExpanded && (
												<div className="p-4 border-t border-border bg-muted/5 text-xs text-muted-foreground leading-relaxed space-y-3 animate-in fade-in duration-200">
													<p>{tool.description}</p>
													{Object.keys(tool.args).length > 0 && (
														<div className="space-y-2 pt-2 border-t border-border/60">
															<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Input Arguments</span>
															<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
																{Object.entries(tool.args).map(([argName, argType]) => (
																	<div key={argName} className="flex justify-between items-center border border-border/60 rounded-lg p-2 bg-background text-[10px]">
																		<span className="font-bold text-foreground">{argName}</span>
																		<span className="text-muted-foreground font-mono">{argType}</span>
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
