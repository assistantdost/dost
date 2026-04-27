"use client";

import Link from "next/link";
import { Marquee } from "@/components/ui/marquee";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	FiZap,
	FiMonitor,
	FiCloud,
	FiMusic,
	FiBarChart2,
	FiShield,
	FiGitBranch,
	FiGithub,
	FiTerminal,
	FiCheckCircle,
	FiCpu,
	FiLayers,
	FiGlobe,
	FiPlus,
} from "react-icons/fi";

function Pill({ children, className }) {
	return (
		<span
			className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}
		>
			{children}
		</span>
	);
}

const marqueeFeatures = [
	{
		icon: <FiMonitor className="h-6 w-6" />,
		text: "Desktop Automation",
		desc: "Control windows, volume & local apps",
	},
	{
		icon: <FiCloud className="h-6 w-6" />,
		text: "Google Calendar Sync",
		desc: "Read and create meetings directly",
	},
	{
		icon: <FiMusic className="h-6 w-6" />,
		text: "Spotify Playback",
		desc: "Play music, skip tracks, switch devices",
	},
	{
		icon: <FiBarChart2 className="h-6 w-6" />,
		text: "Live Stock Prices",
		desc: "Get real-time market data instantly",
	},
	{
		icon: <FiZap className="h-6 w-6" />,
		text: "System Volume",
		desc: "Adjust your desktop audio seamlessly",
	},
	{
		icon: <FiGlobe className="h-6 w-6" />,
		text: "Live Weather",
		desc: "Check current conditions & forecast",
	},
	{
		icon: <FiTerminal className="h-6 w-6" />,
		text: "Terminal Execution",
		desc: "Run background scripts natively",
	},
	{
		icon: <FiShield className="h-6 w-6" />,
		text: "Send Emails",
		desc: "Draft and send via Google Workspace",
	},
	{
		icon: <FiLayers className="h-6 w-6" />,
		text: "Window Management",
		desc: "Organize open applications",
	},
	{
		icon: <FiCpu className="h-6 w-6" />,
		text: "Crypto Trends",
		desc: "Fetch live token prices & trends",
	},
	{
		icon: <FiGitBranch className="h-6 w-6" />,
		text: "Tool Selection",
		desc: "Semantic search picks the right tool",
	},
	{
		icon: <FiPlus className="h-6 w-6" />,
		text: "And Many More...",
		desc: "Limitless extensibility with MCP",
	},
];

function MarqueeFeatureCard({ icon, text, desc }) {
	return (
		<Card className="flex w-[280px] cursor-pointer flex-col gap-3 border-primary/20 bg-card p-5 transition-colors hover:border-primary/60">
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary">
					{icon}
				</div>
				<span className="font-semibold text-foreground">{text}</span>
			</div>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{desc}
			</p>
		</Card>
	);
}

function FeatureMarquee() {
	return (
		<div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-10">
			<Marquee pauseOnHover className="[--duration:40s]">
				{marqueeFeatures.slice(0, 6).map((feat, i) => (
					<MarqueeFeatureCard key={i} {...feat} />
				))}
			</Marquee>
			<Marquee reverse pauseOnHover className="[--duration:40s] mt-4">
				{marqueeFeatures.slice(6).map((feat, i) => (
					<MarqueeFeatureCard key={`rev-${i}`} {...feat} />
				))}
			</Marquee>
			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent"></div>
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent"></div>
		</div>
	);
}

export default function Home() {
	const features = [
		{
			icon: <FiMonitor className="h-6 w-6" />,
			title: "Desktop Productivity",
			desc: "Open apps, manage windows, control volume & brightness, capture screenshots, create notes, and set reminders.",
			borderColor: "border-primary/20",
			iconColor: "text-primary bg-primary/10",
		},
		{
			icon: <FiCloud className="h-6 w-6" />,
			title: "Google Workspace",
			desc: "Read Gmail, send emails, list & create calendar events, search contacts — all from one prompt.",
			borderColor: "border-secondary/20",
			iconColor: "text-secondary bg-secondary/10",
		},
		{
			icon: <FiMusic className="h-6 w-6" />,
			title: "Spotify Control",
			desc: "Play, pause, skip tracks, search music, and switch playback devices without leaving your workflow.",
			borderColor: "border-tertiary/20",
			iconColor: "text-tertiary bg-tertiary/10",
		},
		{
			icon: <FiBarChart2 className="h-6 w-6" />,
			title: "Live Information",
			desc: "Instant access to weather by city, stock prices, crypto trends, metal prices, and currency conversion.",
			borderColor: "border-primary/20",
			iconColor: "text-primary bg-primary/10",
		},
		{
			icon: <FiShield className="h-6 w-6" />,
			title: "Safe & Reliable",
			desc: "OAuth-based access for Google & Spotify, input validation, rate limiting, and secure auth layers.",
			borderColor: "border-secondary/20",
			iconColor: "text-secondary bg-secondary/10",
		},
		{
			icon: <FiGitBranch className="h-6 w-6" />,
			title: "Extensible Architecture",
			desc: "Add any MCP server — databases, CRMs, DevOps pipelines, internal APIs. DOST grows with your needs.",
			borderColor: "border-tertiary/20",
			iconColor: "text-tertiary bg-tertiary/10",
		},
	];

	const workflows = [
		{
			num: "01",
			text: '"Open Chrome, open my notes app, and set volume to 30%."',
			color: "text-primary",
			borderColor: "border-primary/20",
		},
		{
			num: "02",
			text: '"Show my next meetings and email the first attendee."',
			color: "text-secondary",
			borderColor: "border-secondary/20",
		},
		{
			num: "03",
			text: '"Play focus music on Spotify and lower brightness."',
			color: "text-tertiary",
			borderColor: "border-tertiary/20",
		},
		{
			num: "04",
			text: '"Give me weather in Tokyo, Tesla stock, and USD to INR."',
			color: "text-primary",
			borderColor: "border-primary/20",
		},
	];

	return (
		<main className="min-h-screen overflow-x-hidden bg-background font-sans">
			<style>{`
                .hero-badge { animation: floatBadge 4s ease-in-out infinite; }
                @keyframes floatBadge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
            `}</style>

			{/* ── HERO ───────────────────────────────────────────────── */}
			<section className="relative pb-32 pt-[clamp(120px,15vh,180px)] text-center">
				<div className="pointer-events-none absolute left-[20%] top-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
				<div className="pointer-events-none absolute right-[15%] top-[120px] h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[100px]" />

				<div className="relative z-10 mx-auto max-w-4xl px-6">
					<div>
						<div className="hero-badge mb-8 inline-flex items-center gap-2">
							<Pill className="border-primary/30 bg-primary/10 text-primary">
								Personal Agentic AI Assistant
							</Pill>
						</div>

						<h1 className="mb-6 text-[clamp(46px,7vw,90px)] font-bold leading-[1.05] tracking-tight text-foreground">
							One Assistant. <br className="hidden md:block" />
							<span className="text-primary">Real</span>{" "}
							<span className="text-secondary">Actions.</span>
						</h1>

						<p className="mx-auto mb-12 max-w-2xl text-[clamp(18px,2.5vw,22px)] leading-relaxed text-muted-foreground">
							Most assistants are built for conversation. DOST is
							built for execution. Ask naturally, and DOST takes
							action across your desktop and cloud tools.
						</p>

						<div className="flex flex-wrap justify-center gap-4">
							<Button
								asChild
								size="lg"
								className="rounded-full bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20"
							>
								<Link href="/signup">Get Started Free</Link>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
								className="rounded-full border-border bg-transparent px-8 text-base font-semibold text-foreground hover:bg-muted hover:text-foreground"
							>
								<a
									href="https://github.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FiGithub className="mr-2 h-5 w-5" /> View
									on GitHub
								</a>
							</Button>
						</div>
					</div>

					<div className="relative mt-20">
						<Card className="flex h-[clamp(300px,50vw,500px)] w-full flex-col overflow-hidden rounded-3xl border-b-0 border-primary/30 bg-gradient-to-b from-card to-background shadow-2xl shadow-primary/10">
							<div className="flex h-10 w-full items-center gap-2 border-b border-primary/20 bg-card/90 px-4">
								<div className="h-3 w-3 rounded-full bg-destructive" />
								<div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
								<div className="h-3 w-3 rounded-full bg-[#27c93f]" />
								<div className="mx-auto rounded-md border border-primary/20 bg-background/80 px-10 py-1 text-xs text-muted-foreground">
									dost.ai
								</div>
							</div>
							<img
								src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&q=80&w=1600"
								alt="Product Demo"
								className="h-full w-full object-cover opacity-80"
							/>
						</Card>
						<div className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-background to-transparent" />
					</div>
				</div>
			</section>

			{/* ── INTERACTIVE CAROUSEL ───────────────────────────────── */}
			<section className="relative z-10 px-6 pb-32 pt-16">
				<div className="mb-16 text-center">
					<h2 className="text-[clamp(32px,4vw,48px)] font-bold tracking-tight text-foreground">
						See <span className="text-secondary">DOST</span> in
						Action
					</h2>
				</div>
				<FeatureMarquee />
			</section>

			{/* ── TWO ENGINES (SERVERS) ──────────────────────────────── */}
			<section className="border-y border-border/40 bg-card py-24 px-6">
				<div className="mx-auto max-w-5xl">
					<div className="mb-20 text-center">
						<Pill className="border-tertiary/30 bg-tertiary/10 text-tertiary">
							Default Server Setup
						</Pill>
						<h2 className="mt-5 text-[clamp(32px,4vw,48px)] font-bold tracking-tight text-foreground">
							Simple and{" "}
							<span className="text-tertiary">Powerful</span>
						</h2>
						<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
							DOST comes with two default MCP servers designed to
							handle both your local environment and your cloud
							integrations seamlessly.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-10 md:grid-cols-2">
						{/* Desktop Server */}
						<Card className="border-primary/20 bg-background p-10 rounded-3xl">
							<div className="mb-6 flex items-center gap-4">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
									<FiMonitor className="h-7 w-7 text-primary" />
								</div>
								<div>
									<h3 className="text-2xl font-bold text-foreground">
										Desktop Server
									</h3>
									<p className="text-sm font-semibold tracking-wide text-primary">
										LOCAL STUFF
									</p>
								</div>
							</div>
							<p className="mb-6 text-base leading-relaxed text-muted-foreground">
								Your local action engine. It handles on-device
								workflows and system-level tasks.
							</p>
							<ul className="flex flex-col gap-3">
								{[
									"Launching and managing apps",
									"Window and system controls",
									"Notes, reminders, screenshot, clipboard",
									"Local productivity automation",
								].map((item) => (
									<li
										key={item}
										className="flex items-center gap-2.5 text-[15px] text-foreground"
									>
										<FiCheckCircle className="h-[18px] w-[18px] text-primary" />{" "}
										{item}
									</li>
								))}
							</ul>
						</Card>

						{/* Remote Server */}
						<Card className="border-secondary/20 bg-background p-10 rounded-3xl">
							<div className="mb-6 flex items-center gap-4">
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
									<FiCloud className="h-7 w-7 text-secondary" />
								</div>
								<div>
									<h3 className="text-2xl font-bold text-foreground">
										Remote Server
									</h3>
									<p className="text-sm font-semibold tracking-wide text-secondary">
										CLOUD STUFF
									</p>
								</div>
							</div>
							<p className="mb-6 text-base leading-relaxed text-muted-foreground">
								Your online services engine. It handles cloud
								integrations and fetches live data.
							</p>
							<ul className="flex flex-col gap-3">
								{[
									"Google Workspace (Gmail, Calendar, Contacts)",
									"Spotify playback and search",
									"Weather, stocks, crypto, metals, currency",
									"Secure OAuth2 authentication layer",
								].map((item) => (
									<li
										key={item}
										className="flex items-center gap-2.5 text-[15px] text-foreground"
									>
										<FiCheckCircle className="h-[18px] w-[18px] text-secondary" />{" "}
										{item}
									</li>
								))}
							</ul>
						</Card>
					</div>
				</div>
			</section>

			{/* ── FEATURES GRID ──────────────────────────────────────── */}
			<section id="features" className="mx-auto max-w-6xl px-6 py-32">
				<div className="mb-16 text-center">
					<Pill className="border-primary/30 bg-primary/10 text-primary">
						Comprehensive Capabilities
					</Pill>
					<h2 className="mt-5 text-[clamp(32px,4vw,48px)] font-bold tracking-tight text-foreground">
						Everything You Can Do with{" "}
						<span className="text-primary">DOST</span>
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{features.map((f, i) => (
						<Card
							key={i}
							className={`flex flex-col gap-3 bg-card p-5 rounded-2xl ${f.borderColor}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${f.iconColor}`}
								>
									{f.icon}
								</div>
								<h3 className="text-base font-semibold leading-tight text-foreground">
									{f.title}
								</h3>
							</div>
							<p className="text-[14px] leading-relaxed text-muted-foreground">
								{f.desc}
							</p>
						</Card>
					))}
				</div>
			</section>

			{/* ── REAL WORKFLOWS ─────────────────────────────────────── */}
			<section className="border-y border-border/40 bg-card py-24 px-6">
				<div className="mx-auto max-w-5xl">
					<div className="mb-16 text-center">
						<Pill className="border-tertiary/30 bg-tertiary/10 text-tertiary">
							Built for Real Workflows
						</Pill>
						<h2 className="mt-5 text-[clamp(30px,4vw,44px)] font-bold tracking-tight text-foreground">
							One Request.{" "}
							<span className="text-tertiary">
								Multiple Actions.
							</span>
						</h2>
						<p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
							DOST handles complex, multi-step prompts by chaining
							tools together intelligently.
						</p>
					</div>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{workflows.map((w, i) => (
							<Card
								key={i}
								className={`flex flex-row items-start gap-5 p-6 rounded-2xl bg-card ${w.borderColor}`}
							>
								<span
									className={`min-w-[32px] text-2xl font-bold leading-none ${w.color}`}
								>
									{w.num}
								</span>
								<p className="text-base italic leading-relaxed text-foreground">
									{w.text}
								</p>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* ── MCP COMPATIBILITY ──────────────────────────────────── */}
			<section className="mx-auto max-w-5xl px-6 py-32">
				<div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
					<div>
						<Pill className="border-secondary/30 bg-secondary/10 text-secondary">
							MCP Standard
						</Pill>
						<h2 className="my-5 text-[clamp(32px,4vw,48px)] font-bold tracking-tight text-foreground">
							Works with{" "}
							<span className="text-secondary">Any</span> MCP
							Client
						</h2>
						<p className="mb-8 text-[17px] leading-relaxed text-muted-foreground">
							DOST default servers follow the Model Context
							Protocol strictly. This means they are not locked to
							our app. You can use them with any MCP-compatible
							client.
						</p>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{[
								{
									icon: <FiMonitor className="h-5 w-5" />,
									label: "DOST Desktop Client",
								},
								{
									icon: <FiTerminal className="h-5 w-5" />,
									label: "DOST CLI Client",
								},
								{
									icon: <FiCpu className="h-5 w-5" />,
									label: "Custom Internal Clients",
								},
								{
									icon: <FiGlobe className="h-5 w-5" />,
									label: "Third-party MCP Clients",
								},
							].map(({ icon, label }, i) => (
								<div
									key={i}
									className="flex items-center gap-3 text-[15px] font-medium text-foreground"
								>
									<div className="text-secondary">{icon}</div>
									{label}
								</div>
							))}
						</div>
					</div>

					<Card className="relative overflow-hidden rounded-[24px] border-secondary/30 bg-secondary/5 p-10">
						<div className="absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full bg-secondary/15 blur-[50px]" />
						<FiLayers className="mb-6 h-12 w-12 text-secondary" />
						<h3 className="mb-4 text-2xl font-bold text-foreground">
							Add Any Other Server
						</h3>
						<p className="mb-6 text-base leading-relaxed text-muted-foreground">
							DOST is designed to grow with your needs. Keep it
							future-ready and highly extensible by adding more
							servers anytime.
						</p>
						<div className="flex flex-wrap gap-2.5">
							{[
								"Databases & Analytics",
								"CRM Systems",
								"Internal APIs",
								"DevOps Workflows",
							].map((tag) => (
								<span
									key={tag}
									className="rounded-lg border border-secondary/30 bg-background/80 px-4 py-2 text-[13px] font-semibold text-foreground"
								>
									{tag}
								</span>
							))}
						</div>
					</Card>
				</div>
			</section>

			{/* ── CTA ────────────────────────────────────────────────── */}
			<section id="contact" className="px-6 pb-32">
				<Card className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border-primary/30 bg-card px-10 py-20 text-center shadow-2xl shadow-primary/10">
					<div className="absolute -right-[100px] -top-[100px] h-[300px] w-[300px] rounded-full bg-secondary/15 blur-[80px]" />
					<div className="absolute -bottom-[100px] -left-[100px] h-[300px] w-[300px] rounded-full bg-tertiary/15 blur-[80px]" />

					<h2 className="relative mb-6 text-[clamp(36px,5vw,56px)] font-bold leading-tight tracking-tight text-foreground">
						Your App. Your Model.
						<br />
						<span className="text-primary">Your Keys.</span>
					</h2>
					<p className="relative mx-auto mb-10 max-w-lg text-lg leading-relaxed text-muted-foreground">
						Completely free and open source. Start with default
						servers, choose your AI provider, and maintain full
						control over your workflow.
					</p>
					<div className="relative flex justify-center">
						<Button
							asChild
							size="lg"
							className="rounded-full bg-primary px-10 py-6 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20"
						>
							<Link href="/signup">Get DOST Now</Link>
						</Button>
					</div>
				</Card>
			</section>

			{/* ── FOOTER ─────────────────────────────────────────────── */}
			<footer className="border-t border-border/40 bg-card px-6 py-10">
				<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40">
							<FiZap className="h-[18px] w-[18px] text-primary-foreground" />
						</div>
						<div>
							<span className="block text-lg font-bold leading-none text-foreground">
								DOST
							</span>
							<span className="text-xs text-muted-foreground">
								Agentic AI Assistant
							</span>
						</div>
					</div>
					<div className="flex gap-8">
						<Link
							href="/docs"
							className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
						>
							Documentation
						</Link>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
						>
							GitHub Repository
						</a>
					</div>
				</div>
			</footer>
		</main>
	);
}
