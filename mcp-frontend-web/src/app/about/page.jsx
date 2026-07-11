export const metadata = {
	title: "About",
	description: "Learn more about DOST, the open-source agentic AI assistant framework implementing the standardized Model Context Protocol (MCP).",
};

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Layers,
	Cpu,
	ShieldCheck,
	Heart,
	Github,
	Terminal,
	Search,
	Settings,
} from "lucide-react";

export default function AboutPage() {
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
						Product Overview
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">
						About DOST
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						The technical architecture, security principles, and
						agent execution pipelines powering the DOST assistant.
					</p>
				</div>

				{/* Introduction */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
					{/* Core Mission */}
					<Card className="border-border bg-card shadow-sm flex flex-col justify-between">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<Cpu className="h-5 w-5" />
							</div>
							<CardTitle className="text-lg">
								Core Mission
							</CardTitle>
							<CardDescription>
								Bridges conversational AI models with your local
								OS and cloud apps.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground leading-relaxed space-y-3">
							<p>
								Standard LLMs are locked within conversation
								boxes. DOST is built for{" "}
								<strong>execution</strong>. It bridges the gap
								between natural language prompts and functional
								OS APIs (volume/brightness, app launchers, file
								explorers) and cloud services.
							</p>
							<p>
								By adopting the open{" "}
								<strong>Model Context Protocol (MCP)</strong>,
								DOST separates the AI model reasoning loop from
								action execution, enabling secure tool
								connectivity across any compatible environment.
							</p>
						</CardContent>
					</Card>

					{/* Security & Sandbox */}
					<Card className="border-border bg-card shadow-sm flex flex-col justify-between">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<ShieldCheck className="h-5 w-5" />
							</div>
							<CardTitle className="text-lg">
								Security & Privacy
							</CardTitle>
							<CardDescription>
								Strict sandbox controls and localized
								authorization caches.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground leading-relaxed space-y-3">
							<p>
								All desktop tools run locally on your system
								using standard input/output (stdio) transports,
								preventing external data leaks. Sensitive
								command executions are restricted by whitelists
								and path sanitizers.
							</p>
							<p>
								Cloud integrations (Google Workspace, Spotify)
								leverage secure OAuth 2.0. Access credentials
								are cached inside local JSON files or
								Valkey/Redis databases, keeping authentication
								details completely private.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Modular Node Architecture */}
				<Card className="border-border bg-card shadow-sm">
					<CardHeader>
						<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
							<Layers className="h-5 w-5" />
						</div>
						<CardTitle className="text-base font-bold">
							System Architecture
						</CardTitle>
						<CardDescription>
							DOST consists of three primary, decoupled
							components:
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="p-4 border border-border bg-muted/20 rounded-lg flex flex-col justify-between">
								<div>
									<h4 className="text-xs font-bold text-foreground">
										1. Desktop Client / App
									</h4>
									<p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
										The Electron-based desktop interface
										managing active user sessions, prompt
										histories, local database records, and
										launching local MCP servers.
									</p>
								</div>
								<span className="text-[10px] font-mono text-primary mt-3 block">
									Active Workspace (Electron)
								</span>
							</div>
							<div className="p-4 border border-border bg-muted/20 rounded-lg flex flex-col justify-between">
								<div>
									<h4 className="text-xs font-bold text-foreground">
										2. Next.js Web Dashboard
									</h4>
									<p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
										Handles user enrollment signup, Google
										and Spotify OAuth callbacks, and
										generates secure API keys for remote MCP
										server connection.
									</p>
								</div>
								<span className="text-[10px] font-mono text-primary mt-3 block">
									Port 3000 (Local Dev)
								</span>
							</div>
							<div className="p-4 border border-border bg-muted/20 rounded-lg flex flex-col justify-between">
								<div>
									<h4 className="text-xs font-bold text-foreground">
										3. Local & Remote Servers
									</h4>
									<p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
										Stdio daemon (local utilities) and
										uvicorn FastAPI gateway (exposing stock,
										weather, calendar, Spotify, and mail
										tools behind API Key validation).
									</p>
								</div>
								<span className="text-[10px] font-mono text-primary mt-3 block">
									Stdio & Port 8000
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Agent Loop Optimization */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
					{/* ToolRAG Search */}
					<Card className="border-border bg-card shadow-sm flex flex-col justify-between">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<Search className="h-5 w-5" />
							</div>
							<CardTitle className="text-sm font-bold">
								Hybrid ToolRAG Search
							</CardTitle>
							<CardDescription>
								Prevents context bloating by indexing schemas
								dynamically.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
							<p>
								DOST utilizes a hybrid search strategy to locate
								relevant tools. It combines TF-IDF/BM25 text
								searches with vector embeddings, filtering tool
								schemas dynamically. The agent receives only the
								top matching tools for vague queries, keeping
								the prompt small and cost-effective.
							</p>
						</CardContent>
					</Card>

					{/* Sliding Pagination */}
					<Card className="border-border bg-card shadow-sm flex flex-col justify-between">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<Terminal className="h-5 w-5" />
							</div>
							<CardTitle className="text-sm font-bold">
								Context Slicing & Checkpoints
							</CardTitle>
							<CardDescription>
								Auto-compresses history when token counts spike.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
							<p>
								The chat window monitors prompt token sizes.
								When they exceed{" "}
								<code>VITE_SUMMARY_TRIGGER_TOKENS</code>, the
								client initiates a background summarization
								checkpoint, compressing older conversations
								while retaining current context parameters.
								Height-compensation scrolls prevent UI jumping.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Open Source Card */}
				<Card className="border border-primary/30 bg-primary/5 p-6 text-center rounded-xl space-y-4">
					<div className="flex justify-center gap-1.5 text-primary">
						<Heart className="h-5 w-5 fill-current" />
						<span className="text-sm font-bold uppercase tracking-wider">
							MIT Licensed
						</span>
					</div>
					<h3 className="text-lg font-bold">
						100% Client-Owned Operations
					</h3>
					<p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
						DOST is completely open source and extensible. You can
						add your own custom servers, run local models, and
						connect your favorite development editors (such as
						Claude Desktop and Cursor) with zero lock-in.
					</p>
					<div className="flex justify-center">
						<Button
							asChild
							size="sm"
							className="rounded-full px-6 font-semibold shadow-md"
						>
							<a
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2"
							>
								<Github className="h-4 w-4" /> View GitHub Repo
							</a>
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
