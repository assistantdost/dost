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
	CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import FeatureMarquee from "@/components/FeatureMarquee";
import InteractiveShowcase from "@/components/InteractiveShowcase";

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
							<Badge variant="outline" className="mb-6 rounded-full px-4 py-1 text-xs font-semibold bg-muted/50 border-border">
								Personal Agentic AI Assistant
							</Badge>

							<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-tight">
								One Assistant.<br />
								<span className="text-primary">Real Actions.</span>
							</h1>

							<p className="mt-6 text-base text-muted-foreground sm:text-lg max-w-xl leading-relaxed">
								Most AI assistants are built for conversation. DOST is built for execution.
								Ask naturally, and DOST takes action across your desktop and cloud tools.
							</p>

							<div className="mt-8 flex flex-wrap gap-4 justify-start">
								<Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg">
									<Link href="/signup">Get Started Free</Link>
								</Button>
								<Button asChild size="lg" variant="outline" className="rounded-full px-8 font-semibold">
									<a
										href="https://github.com"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2"
									>
										<Github className="h-4 w-4" /> View on GitHub
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
			<section className="py-12 border-t border-b border-border bg-card/30">
				<div className="container mx-auto px-4 max-w-6xl text-center mb-8">
					<h2 className="text-2xl font-bold tracking-tight">Capabilities in Action</h2>
					<p className="text-sm text-muted-foreground mt-2">Dost communicates natively with your system APIs and online cloud services.</p>
				</div>
				<FeatureMarquee />
			</section>

			{/* BENTO GRID MAIN FEATURES */}
			<section id="features" className="py-20 md:py-28">
				<div className="container mx-auto px-4 max-w-6xl">
					<div className="text-center max-w-2xl mx-auto mb-16">
						<Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border">
							Features
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight mt-4 sm:text-4xl">Built for Native Power & Customization</h2>
						<p className="text-muted-foreground mt-4">DOST features an extensible architecture powered by the open Model Context Protocol.</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Card 1 - Desktop (colspan-2) */}
						<Card className="md:col-span-2 border-border bg-card overflow-hidden flex flex-col justify-between">
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
									<Monitor className="h-5 w-5" />
								</div>
								<CardTitle className="text-xl">Desktop Productivity Server</CardTitle>
								<CardDescription>Control your local environment directly from your LLM agent.</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">App Automation</h4>
											<p className="text-xs text-muted-foreground">Launch local binaries, web browsers, and focus tools.</p>
										</div>
									</div>
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">Volume & Brightness</h4>
											<p className="text-xs text-muted-foreground">Direct OS control for system audio and display monitors.</p>
										</div>
									</div>
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">System Utilities</h4>
											<p className="text-xs text-muted-foreground">Automated screenshots, note updates, and clipboard helper.</p>
										</div>
									</div>
									<div className="flex items-start gap-2.5">
										<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
										<div>
											<h4 className="text-sm font-semibold">CLI Scripts</h4>
											<p className="text-xs text-muted-foreground">Run safe terminal commands and script automations natively.</p>
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
								<CardTitle className="text-xl">Cloud Integration</CardTitle>
								<CardDescription>Connect cloud accounts with a single prompt.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
									<span className="text-xs text-muted-foreground"><strong>Workspace:</strong> Send Gmails & read Google Calendar.</span>
								</div>
								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
									<span className="text-xs text-muted-foreground"><strong>Spotify playback:</strong> Switch tracks, pause, and play.</span>
								</div>
								<div className="flex items-start gap-2.5">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
									<span className="text-xs text-muted-foreground"><strong>Live APIs:</strong> Fetch instant stock indices, crypto rates, and weather.</span>
								</div>
							</CardContent>
						</Card>

						{/* Card 3 - Security (colspan-1) */}
						<Card className="border-border bg-card flex flex-col justify-between">
							<CardHeader>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
									<Shield className="h-5 w-5" />
								</div>
								<CardTitle className="text-xl">OAuth Security</CardTitle>
								<CardDescription>Your keys, your credentials, fully secure.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-xs text-muted-foreground leading-relaxed">
									DOST implements OAuth2 flow for all Google and Spotify endpoints. Token exchange happens on your authorized frontend server. No third-party data collection.
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
								<CardTitle className="text-xl">Model Context Protocol Standard</CardTitle>
								<CardDescription>Plugs natively into any MCP server or client ecosystem.</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-xs text-muted-foreground leading-relaxed mb-4">
									Since DOST conforms to the open-source Model Context Protocol standard, you can hook the server infrastructure directly to other clients (like Cursor, Claude Desktop, or custom scripts). You can also add third-party MCP servers with zero custom code.
								</p>
								<div className="flex flex-wrap gap-2">
									<Badge variant="secondary">Postgres & MySQL</Badge>
									<Badge variant="secondary">GitHub Sync</Badge>
									<Badge variant="secondary">Docker Orchestration</Badge>
									<Badge variant="secondary">Jira & Slack APIs</Badge>
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
						<Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border">
							Workflows
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight mt-4">One Request. Multiple Tools.</h2>
						<p className="text-muted-foreground mt-2">Dost semantic search maps complex commands to the exact tool needed.</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{workflows.map((w, i) => (
							<Card key={i} className="border-border bg-card hover:border-primary/50 transition-colors duration-300 p-6 flex gap-4 items-start">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
									{w.num}
								</span>
								<div>
									<h4 className="font-semibold text-sm mb-1">{w.title}</h4>
									<p className="text-xs italic text-muted-foreground mt-1.5">{w.text}</p>
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
							<Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border">
								Interoperable
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight mt-4">Built for All MCP Clients</h2>
							<p className="text-muted-foreground mt-4 text-sm leading-relaxed">
								Dost implements the standard JSON-RPC based Model Context Protocol connection layer. Use it with our visual electron frontend, or bind it directly to terminal clients.
							</p>

							<div className="mt-6 space-y-3">
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>DOST Electron Desktop Client</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>DOST Node-based CLI Companion</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>Claude Desktop and Cursor integration</span>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="h-2 w-2 rounded-full bg-primary" />
									<span>Custom APIs and WebSockets connectors</span>
								</div>
							</div>
						</div>

						<Card className="border-border bg-card p-8 relative overflow-hidden">
							<div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-xl" />
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
								<Terminal className="h-5 w-5" />
							</div>
							<h3 className="text-lg font-bold mb-2">Connect Your Own Server</h3>
							<p className="text-xs text-muted-foreground leading-relaxed mb-6">
								Adding custom servers is simple. Create any executable that communicates over standard input/output (stdio) or WebSockets, and register it inside the configuration panel.
							</p>
							<div className="flex flex-wrap gap-2">
								<Badge variant="secondary">PostgreSQL</Badge>
								<Badge variant="secondary">Puppeteer browser</Badge>
								<Badge variant="secondary">Local Memory</Badge>
							</div>
						</Card>
					</div>
				</div>
			</section>

			{/* FAQ SECTION */}
			<section id="about" className="py-20 md:py-28 bg-muted/20 border-t border-border">
				<div className="container mx-auto px-4 max-w-3xl">
					<div className="text-center mb-12">
						<Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-semibold bg-muted/50 border-border">
							FAQ
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight mt-4">Frequently Asked Questions</h2>
					</div>

					<Accordion type="single" collapsible className="w-full text-left">
						<AccordionItem value="item-1" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">What is DOST-MCP?</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								DOST-MCP is a personal agentic AI assistant framework built on the Model Context Protocol (MCP). It allows local and cloud AI models to interact securely with your local computer and remote web services.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">How does the Desktop Server work?</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								The Desktop Server runs locally on your machine. It executes actions like opening applications, adjusting screen brightness, managing volume, taking screenshots, and accessing files when authorized by you.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">Is my data secure?</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								Yes. All cloud integrations like Google Workspace and Spotify use secure OAuth2 authentication directly with the service providers. Your local desktop server only accepts connections from authorized local clients.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-4" className="border-border">
							<AccordionTrigger className="text-sm font-semibold">Can I add custom tools or APIs?</AccordionTrigger>
							<AccordionContent className="text-xs text-muted-foreground leading-relaxed">
								Absolutely. DOST-MCP follows the open MCP specification. You can plug in any standard MCP server (such as databases, CLI tools, custom APIs, or CRMs) by updating the server configuration.
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
							Your App. Your Model. <span className="text-primary">Your Keys.</span>
						</h2>
						<p className="mt-4 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed relative z-10">
							Completely open source. Choose your preferred AI provider, connect your servers, and run desktop workflows with full autonomy.
						</p>
						<div className="mt-8 flex justify-center relative z-10">
							<Button asChild size="lg" className="rounded-full px-10 font-semibold shadow-lg">
								<Link href="/signup">Get DOST Now</Link>
							</Button>
						</div>
					</Card>
				</div>
			</section>

			{/* FOOTER */}
			<footer className="border-t border-border bg-card/40 py-16 px-6 md:px-12">
				<div className="container mx-auto max-w-6xl">
					{/* Top Part: Statement & Columns */}
					<div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border">
						
						{/* Statement */}
						<div className="md:col-span-6 space-y-4 text-left">
							<h3 className="text-2xl md:text-3xl font-extrabold tracking-tight max-w-[18ch] leading-tight">
								One Assistant.<br />
								Unlimited Actions.
							</h3>
							<p className="text-xs text-muted-foreground max-w-md leading-relaxed">
								DOST is the first open-source personal agentic AI assistant framework implementing the standardized Model Context Protocol (MCP). Connect models to tools locally and safely.
							</p>
						</div>

						{/* Links Columns */}
						<div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left">
							<div className="space-y-3">
								<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</h4>
								<ul className="space-y-2 text-xs">
									<li><Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
									<li><Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
									<li><Link href="/#about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
									<li><Link href="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">Changelog</Link></li>
								</ul>
							</div>
							<div className="space-y-3">
								<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ecosystem</h4>
								<ul className="space-y-2 text-xs">
									<li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub Repository</a></li>
									<li><Link href="/desktop" className="text-muted-foreground hover:text-foreground transition-colors">Desktop App</Link></li>
									<li><Link href="/cli" className="text-muted-foreground hover:text-foreground transition-colors">CLI Companion</Link></li>
									<li><a href="https://modelcontextprotocol.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">MCP Standard</a></li>
								</ul>
							</div>
							<div className="space-y-3 col-span-2 sm:col-span-1">
								<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Legal</h4>
								<ul className="space-y-2 text-xs">
									<li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
									<li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
									<li><Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
								</ul>
							</div>
						</div>
					</div>

					{/* Bottom Part: Meta info */}
					<div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
								<Zap className="h-4 w-4 fill-current" />
							</div>
							<span className="text-sm font-bold tracking-tight">DOST</span>
						</div>

						<div className="flex items-center gap-6 text-[10px] text-muted-foreground">
							<span>&copy; {new Date().getFullYear()} DOST. MIT Licensed.</span>
							<span className="flex items-center gap-1.5">
								<span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
								All systems operational
							</span>
						</div>
					</div>
				</div>
			</footer>
		</main>
	);
}
