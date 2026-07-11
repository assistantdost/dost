export const metadata = {
	title: "Changelog",
	description: "See the latest features, releases, and developer updates for the DOST agentic AI framework.",
};

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	GitBranch,
	Clock,
	ChevronRight,
	Shield,
	Search,
	Terminal,
	Key,
	Database,
	Cpu,
	Layers,
} from "lucide-react";

export default function ChangelogPage() {
	const milestones = [
		{
			version: "v0.1.0-dev",
			title: "Web Redesign Launch & Next.js Setup",
			date: "Latest Main Build (Commits 75583f4 to 1016e58)",
			status: "latest",
			badgeColor: "bg-primary/10 border-primary text-primary",
			icon: GitBranch,
			changes: [
				"Next.js Refactoring: Transitioned web frontend to a full Next.js structure to support server-side rendering and dynamic Markdown processing.",
				"Web Design Overhaul: Designed clean modern layouts with Bento Grid components and HSL tailored dark-mode palettes.",
				"Model Selector Locks: Updated chat capabilities to lock active models and log provider configurations on the server.",
			],
		},
		{
			version: "v0.0.8-dev",
			title: "Infinite Scroll Chat & Multi-User Context Isolation",
			date: "Development Build (Commits b01fe00 to eebb089)",
			status: "stable",
			badgeColor:
				"bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
			icon: Layers,
			changes: [
				"Infinite Scroll Lazy Loading: Configured chunk-based message loading, resolving layout jumping with precise height compensation during scroll-up pagination.",
				"Chat History Summarization: Created token threshold triggers (VITE_SUMMARY_TRIGGER_TOKENS) and conversation window sizing to auto-condense chats.",
				"User Context Separation: Resolved multi-user profile config vanishing by isolating local `mcp.json` parameters in private user directories.",
			],
		},
		{
			version: "v0.0.7-dev",
			title: "Remote MCP Server Authentication & Tool Additions",
			date: "Development Build (Commits 0028692 to fff6ab0)",
			status: "stable",
			badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-500",
			icon: Shield,
			changes: [
				"Remote API Key Authentication: Secured uvicorn remote server endpoints with API Key verification and SHA-256 caching validation.",
				"Scraper & Calculator Tools: Mounted Python calculator logic and web scraping tools into the local stdio package.",
				"ULID Message IDs: Swapped message database identifiers to ULIDs for chronologically sortable and globally unique index storage.",
			],
		},
		{
			version: "v0.0.5-dev",
			title: "Bring Your Own Keys (BYOK) & Model Selector UI",
			date: "Development Build (Commits ba530c6 to c7974c3)",
			status: "stable",
			badgeColor: "bg-purple-500/10 border-purple-500/20 text-purple-500",
			icon: Key,
			changes: [
				"Model Selector & BYOK: Created UI selectors allowing users to configure custom API keys for third-party LLM providers.",
				"Frontend Web Auth: Designed secure session signup, email verifications, and JWT authorization flows on both client and server.",
				"AI Package Update: Handled breaking changes from package upgrades by refactoring chat routing components.",
			],
		},
		{
			version: "v0.0.4-dev",
			title: "Remote Finance Tools & Integrations",
			date: "Development Build (Commits 2d97af6 to ed8a1e4)",
			status: "stable",
			badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-500",
			icon: Database,
			changes: [
				"Finance Toolsets: Integrated live API fetching for cryptocurrency (prices + history), precious metals, and currency conversion.",
				"Spotify & OAuth Callback: Configured Spotify playback command endpoints and uvicorn redirect listeners for secure integration handshakes.",
			],
		},
		{
			version: "v0.0.3-dev",
			title: "Desktop Client Overhaul & Config Stabilization",
			date: "Development Build (Commits b620b3c to fc339af)",
			status: "stable",
			badgeColor: "bg-rose-500/10 border-rose-500/20 text-rose-500",
			icon: Terminal,
			changes: [
				"Electron Restructure: Overhauled mcp-desktop-client folders to separate main process logic, RAG scripts, and React layout modules.",
				"Config Loader: Stabilized the main process by dynamically loading configurations directly from environment variables.",
			],
		},
		{
			version: "v0.0.2-dev",
			title: "ToolRAG Query Optimization & Hybrid Search",
			date: "Development Build (Commits 850d27d to fc339af)",
			status: "stable",
			badgeColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
			icon: Search,
			changes: [
				"Hybrid Tool Search: Enabled BM25 text relevance matching combined with vector similarity to locate appropriate tools for vague queries.",
				"Optimal Selection Loops: Configured tool execution safety decorators, rate-limiting handlers, and loop boundaries.",
			],
		},
		{
			version: "v0.0.1-dev",
			title: "Core MCP Infrastructure & Caching",
			date: "Initial Build (Commits 0919258 to cdcff3e)",
			status: "stable",
			badgeColor: "bg-slate-500/10 border-slate-500/20 text-slate-500",
			icon: Cpu,
			changes: [
				"Initial Repository Release: Created base project structure establishing the local MCP server and stdio client connections.",
				"Cached Tools Store: Configured local tools cache and state synchronizer actions to cache schemas upon initialization.",
			],
		},
	];

	return (
		<div className="min-h-screen bg-background text-foreground p-2 md:p-6 mt-28 font-sans relative overflow-hidden">
			{/* Decorative background glows */}
			<div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-[100px]" />
			<div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />

			<div className="container mx-auto px-4 max-w-4xl space-y-8 relative z-10">
				{/* Header */}
				<div className="text-left border-b border-border/60 pb-6">
					<Badge
						variant="outline"
						className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full"
					>
						Main Branch Development Timeline
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">
						Changelog & Milestones
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						The development release logs extracted from the main
						branch commit history of DOST.
					</p>
				</div>

				{/* Timeline */}
				<div className="relative border-l border-border pl-6 ml-4 md:pl-8 md:ml-6 space-y-12">
					{milestones.map((milestone) => {
						const IconComponent = milestone.icon;
						return (
							<div key={milestone.version} className="relative">
								{/* Node dot icon */}
								<span
									className={`absolute -left-[37px] md:-left-[45px] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground ${
										milestone.status === "latest"
											? "text-primary border-primary"
											: ""
									}`}
								>
									<IconComponent className="h-3 w-3" />
								</span>

								<div className="space-y-4">
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${milestone.badgeColor}`}
										>
											{milestone.version}
										</Badge>
										<span className="text-xs text-muted-foreground flex items-center gap-1">
											<Clock className="h-3 w-3" />{" "}
											{milestone.date}
										</span>
									</div>

									<Card className="border-border bg-card shadow-sm hover:border-primary/30 transition-colors duration-300">
										<CardHeader className="pb-3">
											<CardTitle className="text-base font-bold text-foreground">
												{milestone.title}
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<ul className="space-y-3">
												{milestone.changes.map(
													(change, cIdx) => {
														const [title, desc] =
															change.split(": ");
														return (
															<li
																key={cIdx}
																className="text-xs md:text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed"
															>
																<ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
																<div>
																	<strong className="text-foreground font-semibold">
																		{title}
																	</strong>
																	{desc && (
																		<span className="text-muted-foreground">
																			:{" "}
																			{
																				desc
																			}
																		</span>
																	)}
																</div>
															</li>
														);
													},
												)}
											</ul>
										</CardContent>
									</Card>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
