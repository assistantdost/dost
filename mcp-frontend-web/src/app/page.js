// Hallmark · macrostructure: Bento Grid · tone: technical · anchor hue: green
"use client";

import Link from "next/link";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Monitor,
	Calendar,
	Music,
	Terminal,
	Cloud,
	Shield,
	GitBranch,
	ExternalLink,
	Zap,
	Github,
	CheckCircle2,
} from "lucide-react";
import { FaWindows } from "react-icons/fa";
import FeatureMarquee from "@/components/FeatureMarquee";
import InteractiveShowcase from "@/components/InteractiveShowcase";
import Footer from "@/components/Footer";

const GITHUB_URL = "https://github.com/assistantdost/dost";
const DEMO_VIDEO_EMBED_URL = "https://www.youtube.com/embed/YRQ9Ke-wTZ8";

export default function Home() {
	const workflows = [
		{
			num: "01",
			title: "Workspace Setup",
			text: '"Open Chrome, open my notes app, and set volume to 30%."',
		},
		{
			num: "02",
			title: "Cloud Outreach",
			text: '"Show my next meetings and email the first attendee."',
		},
		{
			num: "03",
			title: "Context Control",
			text: '"Play focus music on Spotify and lower brightness."',
		},
		{
			num: "04",
			title: "Information Briefing",
			text: '"Give me weather in Tokyo, Tesla stock, and USD to INR."',
		},
	];

	return (
		<main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
			{/* HERO SECTION */}
			<section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
				{/* Background glows */}
				<div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
				<div className="absolute top-1/3 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />

				<div className="container mx-auto px-6 max-w-6xl">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
						{/* Left Column: Left-aligned content */}
						<div className="lg:col-span-6 text-left flex flex-col items-start">
							<Badge
								variant="outline"
								className="mb-6 rounded-full px-4 py-1 text-sm font-semibold bg-muted/50 border-border"
							>
								One Assistant real actions.
							</Badge>

							<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-tight">
								Personal Agentic
								<br />
								<span className="text-primary">
									AI Assistant
								</span>
							</h1>

							<p className="mt-6 text-base text-muted-foreground sm:text-lg max-w-xl leading-relaxed">
								Most AI assistants are built for conversation.
								DOST is built for execution. Ask naturally, and
								DOST takes action across your Windows desktop
								and cloud tools.
							</p>

							<p className="mt-4 ml-2  flex items-center gap-2">
								<FaWindows className="h-4 w-4 text-blue-500" />
								Windows OS Only
							</p>

							<div className="mt-4 flex flex-wrap gap-4 justify-start">
								<Button
									size="lg"
									className="rounded-full px-8 font-semibold shadow-lg cursor-pointer"
									onClick={() => {
										document
											.getElementById("capabilities")
											?.scrollIntoView({
												behavior: "smooth",
											});
									}}
								>
									Get Started
								</Button>
								<Button
									asChild
									size="lg"
									variant="outline"
									className="rounded-full px-8 font-semibold"
								>
									<a
										href={GITHUB_URL}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2"
									>
										<Github className="h-4 w-4" /> GitHub
									</a>
								</Button>
							</div>
						</div>

						{/* Right Column: Interactive Carousel Showcase */}
						<div className="lg:col-span-6 w-full flex items-center justify-center">
							<InteractiveShowcase />
						</div>
					</div>
				</div>
			</section>

			{/* MARQUEE CAROUSEL */}
			<section
				id="capabilities"
				className="py-12 border-t border-b border-border bg-card/30"
			>
				<div className="container mx-auto px-4 max-w-6xl text-center mb-8">
					<h2 className="text-2xl font-bold tracking-tight">
						Capabilities in Action
					</h2>
					<p className="text-base text-muted-foreground mt-2">
						Dost communicates natively with your system APIs and
						online cloud services.
					</p>
				</div>
				<FeatureMarquee />
			</section>

			{/* DEMO VIDEO SECTION */}
			<section className="py-20 md:py-28 bg-muted/10 border-b border-border">
				<div className="container mx-auto px-6 max-w-6xl">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
						{/* Left Column: Title & Description */}
						<div className="lg:col-span-5 text-left flex flex-col items-start">
							<Badge
								variant="outline"
								className="mb-6 rounded-full px-4 py-1 text-xs font-semibold bg-muted/50 border-border"
							>
								Demo
							</Badge>

							<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
								DOST in Action
							</h2>

							<p className="mt-6 text-base text-muted-foreground leading-relaxed">
								Watch how DOST connects your custom workflows,
								system APIs, and external cloud accounts into a
								unified, secure execution loop.
							</p>

							<div className="mt-6 space-y-3 w-full">
								<div className="flex items-center gap-3 text-sm">
									<div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
									<span>
										Execute local system scripts and
										binaries
									</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
									<span>
										Automate Chrome, media playback, and
										volume control
									</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
									<span>
										Secure authentication handling via
										remote server
									</span>
								</div>
							</div>
						</div>

						{/* Right Column: Demo Video Player */}
						<div className="lg:col-span-7 w-full">
							<div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-2xl bg-black">
								<iframe
									src={DEMO_VIDEO_EMBED_URL}
									title="DOST MCP Demo Video"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowFullScreen
									className="absolute inset-0 w-full h-full border-0"
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ARCHITECTURE & SETUP QUICK LINKS */}
			<section className="py-12 border-b border-border bg-background">
				<div className="container mx-auto px-6 max-w-6xl">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Setup Guide Card */}
						<Card className="border-border bg-card/40 hover:bg-card/75 transition-all duration-300 flex flex-col justify-between p-6 shadow-md hover:shadow-lg">
							<div className="space-y-2">
								<Badge
									variant="outline"
									className="w-fit rounded-full text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
								>
									Setup Guide
								</Badge>
								<h3 className="text-lg font-bold">
									Getting Started
								</h3>
								<p className="text-base text-muted-foreground leading-relaxed">
									Need step-by-step instructions on
									environment variables, registry
									configuration, and client execution? Follow
									our detailed setup guide.
								</p>
							</div>
							<div className="mt-6">
								<Button
									asChild
									variant="outline"
									className="rounded-full font-medium border-border hover:bg-muted/80"
								>
									<Link
										href="/docs"
										className="flex items-center gap-1.5"
									>
										Open Setup Docs{" "}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</Button>
							</div>
						</Card>

						{/* Technical / Architecture Card */}
						<Card className="border-border bg-card/40 hover:bg-card/75 transition-all duration-300 flex flex-col justify-between p-6 shadow-md hover:shadow-lg">
							<div className="space-y-2">
								<Badge
									variant="outline"
									className="w-fit rounded-full text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
								>
									Architecture
								</Badge>
								<h3 className="text-lg font-bold">
									Technical Specifications
								</h3>
								<p className="text-base text-muted-foreground leading-relaxed">
									Want to know about our hybrid fastMCP
									architecture, system context truncation
									filters, and secure stdio/HTTP message
									loops? Dive into our technical docs.
								</p>
							</div>
							<div className="mt-6">
								<Button
									asChild
									variant="outline"
									className="rounded-full font-medium border-border hover:bg-muted/80"
								>
									<Link
										href="/technical"
										className="flex items-center gap-1.5"
									>
										Explore Technical Architecture{" "}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</Button>
							</div>
						</Card>
					</div>
				</div>
			</section>

			{/* BENTO GRID MAIN FEATURES */}
			<section id="features" className="py-20 md:py-28">
				<div className="container mx-auto px-4 max-w-6xl">
					<div className="text-center max-w-2xl mx-auto mb-16">
						<Badge
							variant="outline"
							className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border"
						>
							Features
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight mt-4 sm:text-4xl">
							Built for Native Power & Customization
						</h2>
						<p className="text-muted-foreground mt-4">
							DOST features an extensible architecture powered by
							the open Model Context Protocol.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Card 1 - Desktop (colspan-2) */}
						<Card className="md:col-span-2 border-border bg-card overflow-hidden flex flex-col justify-between">
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
									<Monitor className="h-5 w-5" />
								</div>
								<CardTitle className="text-xl">
									Desktop Productivity Server
								</CardTitle>
								<CardDescription>
									Control your local environment directly from
									your LLM agent.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">
												App Automation
											</h4>
											<p className="text-xs text-muted-foreground">
												Launch local binaries, web
												browsers, and focus tools.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">
												Volume & Brightness
											</h4>
											<p className="text-xs text-muted-foreground">
												Direct OS control for system
												audio and display monitors.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">
												System Utilities
											</h4>
											<p className="text-xs text-muted-foreground">
												Automated screenshots, note
												updates, and clipboard helper.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">
												CLI Scripts
											</h4>
											<p className="text-xs text-muted-foreground">
												Run safe terminal commands and
												script automations natively.
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Card 2 - Cloud (colspan-1) */}
						<Card className="border-border bg-card flex flex-col justify-between">
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
									<Cloud className="h-5 w-5" />
								</div>
								<CardTitle className="text-xl">
									Cloud Integration
								</CardTitle>
								<CardDescription>
									Connect cloud accounts with a single prompt.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
									<span className="text-xs text-muted-foreground">
										<strong>Workspace:</strong> Send Gmails
										& read Google Calendar.
									</span>
								</div>
								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
									<span className="text-xs text-muted-foreground">
										<strong>Spotify playback:</strong>{" "}
										Switch tracks, pause, and play.
									</span>
								</div>
								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
									<span className="text-xs text-muted-foreground">
										<strong>Live APIs:</strong> Fetch
										instant stock indices, crypto rates, and
										weather.
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Card 3 - Security (colspan-1) */}
						<Card className="border-border bg-card flex flex-col justify-between">
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
									<Shield className="h-5 w-5" />
								</div>
								<CardTitle className="text-xl">
									OAuth Security
								</CardTitle>
								<CardDescription>
									Your keys, your credentials, fully secure.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-xs text-muted-foreground leading-relaxed">
									DOST implements OAuth2 flow for all Google
									and Spotify endpoints. Token exchange
									happens on your secure Remote MCP Server. No
									third-party data collection.
								</p>
								<div className="rounded border border-border p-2 bg-muted/40 text-[10px] font-mono">
									OAuth state validation: verified
								</div>
							</CardContent>
						</Card>

						{/* Card 4 - Extensibility (colspan-2) */}
						<Card className="md:col-span-2 border-border bg-card flex flex-col justify-between">
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
									<GitBranch className="h-5 w-5" />
								</div>
								<CardTitle className="text-xl">
									Model Context Protocol Standard
								</CardTitle>
								<CardDescription>
									Plugs natively into any MCP server or client
									ecosystem.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground leading-relaxed mb-4">
									Since DOST conforms to the open-source Model
									Context Protocol standard, you can hook the
									server infrastructure directly to other
									clients (like Cursor, Claude Desktop, or
									custom scripts). You can also add
									third-party MCP servers with zero custom
									code.
								</p>
								<div className="flex flex-wrap gap-2">
									<Badge variant="secondary">
										Postgres & MySQL
									</Badge>
									<Badge variant="secondary">
										GitHub Sync
									</Badge>
									<Badge variant="secondary">
										Docker Orchestration
									</Badge>
									<Badge variant="secondary">
										Jira & Slack APIs
									</Badge>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* WORKFLOW TIMELINE */}
			<section className="py-20 bg-muted/30 border-t border-b border-border">
				<div className="container mx-auto px-4 max-w-5xl">
					<div className="text-center max-w-2xl mx-auto mb-16">
						<Badge
							variant="outline"
							className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border"
						>
							Workflows
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight mt-4">
							One Request. Multiple Tools.
						</h2>
						<p className="text-muted-foreground mt-2">
							Dost semantic search maps complex commands to the
							exact tool needed.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{workflows.map((w, i) => (
							<Card
								key={i}
								className="border-border bg-card hover:border-primary/50 transition-colors duration-300 p-6 flex gap-4 items-start"
							>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
									{w.num}
								</span>
								<div>
									<h4 className="font-semibold text-sm mb-1">
										{w.title}
									</h4>
									<p className="text-xs italic text-muted-foreground mt-1.5">
										{w.text}
									</p>
								</div>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* INTEROPERABILITY SECTION */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4 max-w-5xl">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						<div>
							<Badge
								variant="outline"
								className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border"
							>
								Interoperable
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight mt-4">
								Built for All MCP Clients
							</h2>
							<p className="text-muted-foreground mt-4 text-sm leading-relaxed">
								Dost implements the standard JSON-RPC based
								Model Context Protocol connection layer. Use it
								with our visual electron frontend, or bind it
								directly to terminal clients.
							</p>

							<div className="mt-6 space-y-3">
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>DOST Electron Desktop Client</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>DOST Python-based CLI Companion</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>
										Claude Desktop and Cursor integration
									</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>
										Custom APIs and SSE/HTTP connectors
									</span>
								</div>
							</div>
						</div>

						<Card className="border-border bg-card p-8 relative overflow-hidden">
							<div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-xl" />
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
								<Terminal className="h-5 w-5" />
							</div>
							<h3 className="text-lg font-bold mb-2">
								Connect Your Own Server
							</h3>
							<p className="text-xs text-muted-foreground leading-relaxed mb-6">
								Adding custom servers is simple. Create any
								executable that communicates over standard
								input/output (stdio) or HTTP/SSE, and register
								it inside the configuration panel.
							</p>
							<div className="flex flex-wrap gap-2">
								<Badge variant="secondary">PostgreSQL</Badge>
								<Badge variant="secondary">
									Puppeteer browser
								</Badge>
								<Badge variant="secondary">Local Memory</Badge>
							</div>
						</Card>
					</div>
				</div>
			</section>

			{/* FAQ SECTION */}
			<section
				id="about"
				className="py-20 md:py-28 bg-muted/20 border-t border-border"
			>
				<div className="container mx-auto px-4 max-w-3xl">
					<div className="text-center mb-12">
						<Badge
							variant="outline"
							className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border"
						>
							FAQ
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight mt-4">
							Frequently Asked Questions
						</h2>
					</div>

					<Accordion
						type="single"
						collapsible
						className="w-full text-left"
					>
						<AccordionItem value="item-1" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">
								What is DOST-MCP?
							</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								DOST-MCP is a personal agentic AI assistant
								framework built on the open Model Context
								Protocol (MCP). It enables secure execution of
								desktop commands and cloud automations through
								localized LLM requests.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">
								Is DOST compatible with OS platforms other than
								Windows?
							</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								No, the DOST desktop client and local
								productivity servers are built and optimized
								exclusively for Windows systems. It integrates
								natively with Windows APIs to control volume,
								screen settings, window layout, and run local
								binaries.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">
								How do I get started with DOST?
							</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								Since DOST is completely open source, you can
								get started by visiting our GitHub repository.
								Clone the repository, set up your model
								credentials, and run the installer. Detailed
								steps are in our Setup Guide.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-4" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">
								How does the security model work?
							</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								All local executions (file search,
								screenshotting, system parameters) are run
								locally by your Python-based Stdio server. Cloud
								integrations like Gmail and Spotify handle OAuth
								tokens securely in your browser/local state.
								Your keys and tokens are stored on your machine.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-5" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">
								Can I integrate DOST with other clients like
								Cursor or Claude Desktop?
							</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								Yes! Since DOST conforms fully to the open Model
								Context Protocol standard, you can point Cursor
								or Claude Desktop configuration files to the
								Python stdio binary for direct tool execution
								inside your favorite environment. Check our
								"Connecting to Other Clients" guide.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</section>

			{/* FINAL CTA SECTION */}
			<section id="contact" className="py-20 md:py-28">
				<div className="container mx-auto px-4 max-w-4xl">
					<Card className="border-border bg-card p-12 text-center relative overflow-hidden shadow-2xl">
						<div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
						<div className="absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />

						<h2 className="text-3xl md:text-4xl font-extrabold tracking-tight relative z-10">
							Your App. Your Model.{" "}
							<span className="text-primary">Your Keys.</span>
						</h2>
						<p className="mt-4 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed relative z-10">
							Completely open source. Choose your preferred AI
							provider, connect your servers, and run desktop
							workflows with full autonomy.
						</p>
						<div className="mt-8 flex justify-center relative z-10">
							<Button
								asChild
								size="lg"
								className="rounded-full px-10 font-semibold shadow-lg"
							>
								<a
									href={GITHUB_URL}
									target="_blank"
									rel="noopener noreferrer"
								>
									Get DOST Now
								</a>
							</Button>
						</div>
					</Card>
				</div>
			</section>

			<Footer />
		</main>
	);
}
