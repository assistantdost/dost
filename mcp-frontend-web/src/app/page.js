"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
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
	FiChevronLeft,
	FiChevronRight,
	FiCpu,
	FiLayers,
	FiLock,
	FiGlobe,
	FiPlus,
} from "react-icons/fi";

// ─── Tiny primitives ─────────────────────────────────────────────────────────
const C = {
	cyan: "#00D2FF",
	lime: "#9DFF00",
	pink: "#EA4C89",
	bg: "#0D0C22",
	card: "#121127",
	text: "#E3DFFE",
	muted: "#BBC9CF",
};

function Pill({ children, color = C.cyan }) {
	return (
		<span
			style={{
				background: `${color}18`,
				color,
				border: `1px solid ${color}30`,
				borderRadius: 9999,
				padding: "4px 14px",
				fontSize: 12,
				fontWeight: 600,
				letterSpacing: "0.05em",
				textTransform: "uppercase",
			}}
		>
			{children}
		</span>
	);
}

function FeatureCard({ icon, title, desc, accent }) {
	return (
		<motion.div
			whileHover={{ y: -5, borderColor: `${accent}60` }}
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.4 }}
			style={{
				background: C.card,
				border: `1px solid ${accent}20`,
				borderRadius: 20,
				padding: "32px 28px",
				cursor: "default",
				height: "100%",
			}}
		>
			<div
				style={{
					width: 48,
					height: 48,
					borderRadius: 14,
					background: `${accent}18`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 20,
					color: accent,
				}}
			>
				{icon}
			</div>
			<h3
				style={{
					color: C.text,
					fontWeight: 600,
					fontSize: 18,
					marginBottom: 12,
				}}
			>
				{title}
			</h3>
			<p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>
				{desc}
			</p>
		</motion.div>
	);
}

function WorkflowCard({ num, text, accent }) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			whileInView={{ opacity: 1, x: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.5 }}
			style={{
				background: C.card,
				border: `1px solid ${accent}20`,
				borderRadius: 16,
				padding: "24px",
				display: "flex",
				alignItems: "flex-start",
				gap: 20,
			}}
		>
			<span
				style={{
					color: accent,
					fontWeight: 700,
					fontSize: 24,
					lineHeight: 1,
					minWidth: 32,
				}}
			>
				{num}
			</span>
			<p
				style={{
					color: C.text,
					fontSize: 16,
					lineHeight: 1.6,
					fontStyle: "italic",
				}}
			>
				{text}
			</p>
		</motion.div>
	);
}

// ─── Feature Marquee ───────────────────────────────────────────────────────
const marqueeFeatures = [
	{ icon: <FiMonitor size={24} />, text: "Desktop Automation", desc: "Control windows, volume & local apps" },
	{ icon: <FiCloud size={24} />, text: "Google Calendar Sync", desc: "Read and create meetings directly" },
	{ icon: <FiMusic size={24} />, text: "Spotify Playback", desc: "Play music, skip tracks, switch devices" },
	{ icon: <FiBarChart2 size={24} />, text: "Live Stock Prices", desc: "Get real-time market data instantly" },
	{ icon: <FiZap size={24} />, text: "System Volume", desc: "Adjust your desktop audio seamlessly" },
	{ icon: <FiGlobe size={24} />, text: "Live Weather", desc: "Check current conditions & forecast" },
	{ icon: <FiTerminal size={24} />, text: "Terminal Execution", desc: "Run background scripts natively" },
	{ icon: <FiShield size={24} />, text: "Send Emails", desc: "Draft and send via Google Workspace" },
	{ icon: <FiLayers size={24} />, text: "Window Management", desc: "Organize open applications" },
	{ icon: <FiCpu size={24} />, text: "Crypto Trends", desc: "Fetch live token prices & trends" },
	{ icon: <FiGitBranch size={24} />, text: "Tool Selection", desc: "Semantic search picks the right tool" },
	{ icon: <FiPlus size={24} />, text: "And Many More...", desc: "Limitless extensibility with MCP" },
];

function MarqueeFeatureCard({ icon, text, desc }) {
	return (
		<div className="flex flex-col gap-3 p-5 rounded-2xl border border-cyan-500/20 bg-[#121127] min-w-[280px] hover:border-cyan-500/60 transition-colors cursor-pointer" style={{ width: 280 }}>
			<div className="flex items-center gap-3">
				<div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
					{icon}
				</div>
				<span className="text-[#E3DFFE] font-semibold">{text}</span>
			</div>
			<p className="text-[#BBC9CF] text-sm leading-relaxed">
				{desc}
			</p>
		</div>
	);
}

function FeatureMarquee() {
	return (
		<div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-10">
			<Marquee pauseOnHover className="[--duration:40s]">
				{marqueeFeatures.map((feat, i) => (
					<MarqueeFeatureCard key={i} {...feat} />
				))}
			</Marquee>
			<Marquee reverse pauseOnHover className="[--duration:40s] mt-4">
				{[...marqueeFeatures].reverse().map((feat, i) => (
					<MarqueeFeatureCard key={`rev-${i}`} {...feat} />
				))}
			</Marquee>
			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#0D0C22] dark:from-background"></div>
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#0D0C22] dark:from-background"></div>
		</div>
	);
}


// ─── Page ────────────────────────────────────────────────────────────────────
export default function Home() {
	const features = [
		{
			icon: <FiMonitor size={24} />,
			title: "Desktop Productivity",
			desc: "Open apps, manage windows, control volume & brightness, capture screenshots, create notes, and set reminders.",
			accent: C.cyan,
		},
		{
			icon: <FiCloud size={24} />,
			title: "Google Workspace",
			desc: "Read Gmail, send emails, list & create calendar events, search contacts — all from one prompt.",
			accent: C.lime,
		},
		{
			icon: <FiMusic size={24} />,
			title: "Spotify Control",
			desc: "Play, pause, skip tracks, search music, and switch playback devices without leaving your workflow.",
			accent: C.pink,
		},
		{
			icon: <FiBarChart2 size={24} />,
			title: "Live Information",
			desc: "Instant access to weather by city, stock prices, crypto trends, metal prices, and currency conversion.",
			accent: C.cyan,
		},
		{
			icon: <FiShield size={24} />,
			title: "Safe & Reliable",
			desc: "OAuth-based access for Google & Spotify, input validation, rate limiting, and secure auth layers.",
			accent: C.lime,
		},
		{
			icon: <FiGitBranch size={24} />,
			title: "Extensible Architecture",
			desc: "Add any MCP server — databases, CRMs, DevOps pipelines, internal APIs. DOST grows with your needs.",
			accent: C.pink,
		},
	];

	const workflows = [
		{
			num: "01",
			text: '"Open Chrome, open my notes app, and set volume to 30%."',
			accent: C.cyan,
		},
		{
			num: "02",
			text: '"Show my next meetings and email the first attendee."',
			accent: C.lime,
		},
		{
			num: "03",
			text: '"Play focus music on Spotify and lower brightness."',
			accent: C.pink,
		},
		{
			num: "04",
			text: '"Give me weather in Tokyo, Tesla stock, and USD to INR."',
			accent: C.cyan,
		},
	];

	const clients = [
		{ icon: <FiMonitor size={20} />, label: "DOST Desktop Client" },
		{ icon: <FiTerminal size={20} />, label: "DOST CLI Client" },
		{ icon: <FiCpu size={20} />, label: "Custom Internal MCP Clients" },
		{ icon: <FiGlobe size={20} />, label: "Third-party MCP Clients" },
	];

	return (
		<>
			<style>{`
				.hero-badge { animation: floatBadge 4s ease-in-out infinite; }
				@keyframes floatBadge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
				.glow-dot { animation: pulse 2s ease-in-out infinite; }
				@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} }
				.marquee-track { display:flex; gap:16px; animation: marquee 25s linear infinite; width:max-content; }
				@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
				.stat-num { font-size: 48px; font-weight: 700; letter-spacing: -0.03em; line-height:1; }
			`}</style>

			<main
				style={{
					background: C.bg,
					minHeight: "100vh",
					fontFamily: "var(--font-poppins), sans-serif",
					overflowX: "hidden",
				}}
			>
				{/* ── HERO ───────────────────────────────────────────────── */}
				<section
					style={{
						paddingTop: "clamp(120px, 15vh, 180px)",
						paddingBottom: 120,
						textAlign: "center",
						position: "relative",
					}}
				>
					{/* Ambient glows */}
					<div
						style={{
							position: "absolute",
							top: 40,
							left: "20%",
							width: 500,
							height: 500,
							borderRadius: "50%",
							background: `${C.cyan}0c`,
							filter: "blur(100px)",
							pointerEvents: "none",
						}}
					/>
					<div
						style={{
							position: "absolute",
							top: 120,
							right: "15%",
							width: 400,
							height: 400,
							borderRadius: "50%",
							background: `${C.lime}0a`,
							filter: "blur(100px)",
							pointerEvents: "none",
						}}
					/>

					<div
						style={{
							maxWidth: 900,
							margin: "0 auto",
							padding: "0 24px",
							position: "relative",
							zIndex: 1,
						}}
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
						>
							<div
								className="hero-badge"
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 8,
									marginBottom: 32,
								}}
							>
								<Pill color={C.cyan}>
									Personal Agentic AI Assistant
								</Pill>
							</div>

							<h1
								style={{
									fontSize: "clamp(46px,7vw,90px)",
									fontWeight: 700,
									color: C.text,
									letterSpacing: "-0.03em",
									lineHeight: 1.05,
									marginBottom: 24,
								}}
							>
								One Assistant.{" "}
								<br className="hidden md:block" />
								<span style={{ color: C.cyan }}>Real</span>{" "}
								<span style={{ color: C.lime }}>Actions.</span>
							</h1>

							<p
								style={{
									fontSize: "clamp(18px,2.5vw,22px)",
									color: C.muted,
									lineHeight: 1.6,
									maxWidth: 680,
									margin: "0 auto 48px",
								}}
							>
								Most assistants are built for conversation. DOST
								is built for execution. Ask naturally, and DOST
								takes action across your desktop and cloud
								tools.
							</p>

							<div
								style={{
									display: "flex",
									gap: 16,
									justifyContent: "center",
									flexWrap: "wrap",
								}}
							>
								<Link href="/signup">
									<motion.button
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										style={{
											background: C.cyan,
											color: C.bg,
											borderRadius: 9999,
											padding: "16px 36px",
											fontWeight: 700,
											fontSize: 16,
											border: "none",
											cursor: "pointer",
											boxShadow: `0 0 30px ${C.cyan}40`,
										}}
									>
										Get Started Free
									</motion.button>
								</Link>
								<a
									href="https://github.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									<motion.button
										whileHover={{
											backgroundColor: `${C.text}0a`,
											borderColor: `${C.text}60`,
										}}
										whileTap={{ scale: 0.95 }}
										style={{
											background: "transparent",
											color: C.text,
											borderRadius: 9999,
											padding: "15px 32px",
											fontWeight: 600,
											fontSize: 16,
											border: `1px solid ${C.text}25`,
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
											gap: 10,
										}}
									>
										<FiGithub size={20} /> View on GitHub
									</motion.button>
								</a>
							</div>
						</motion.div>

						{/* Floating Product Image Placeholder */}
						<motion.div
							initial={{ opacity: 0, y: 50 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							style={{ marginTop: 80, position: "relative" }}
						>
							<div
								style={{
									width: "100%",
									height: "clamp(300px, 50vw, 500px)",
									background: `linear-gradient(180deg, ${C.card} 0%, ${C.bg} 100%)`,
									borderRadius: 24,
									border: `1px solid ${C.cyan}30`,
									borderBottom: "none",
									boxShadow: `0 -20px 60px ${C.cyan}15`,
									display: "flex",
									flexDirection: "column",
									overflow: "hidden",
								}}
							>
								{/* Magic UI Safari Top Bar */}
								<div
									style={{
										width: "100%",
										height: 40,
										background: `${C.card}90`,
										borderBottom: `1px solid ${C.cyan}20`,
										display: "flex",
										alignItems: "center",
										padding: "0 16px",
										gap: 8,
									}}
								>
									<div
										style={{
											width: 12,
											height: 12,
											borderRadius: "50%",
											background: "#ff5f56",
										}}
									/>
									<div
										style={{
											width: 12,
											height: 12,
											borderRadius: "50%",
											background: "#ffbd2e",
										}}
									/>
									<div
										style={{
											width: 12,
											height: 12,
											borderRadius: "50%",
											background: "#27c93f",
										}}
									/>
									<div
										style={{
											margin: "0 auto",
											background: `${C.bg}80`,
											borderRadius: 6,
											padding: "4px 40px",
											fontSize: 12,
											color: C.muted,
											border: `1px solid ${C.cyan}20`,
										}}
									>
										dost.ai
									</div>
								</div>
								<img
									src="https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&q=80&w=1600"
									alt="Product Demo"
									style={{
										width: "100%",
										height: "100%",
										objectFit: "cover",
										opacity: 0.8,
									}}
								/>
							</div>
							{/* Fade out gradient at bottom */}
							<div
								style={{
									position: "absolute",
									bottom: 0,
									left: 0,
									right: 0,
									height: 150,
									background: `linear-gradient(0deg, ${C.bg} 0%, transparent 100%)`,
								}}
							/>
						</motion.div>
					</div>
				</section>

				{/* ── INTERACTIVE CAROUSEL ───────────────────────────────── */}
				<section
					style={{
						padding: "60px 24px 120px",
						position: "relative",
						zIndex: 2,
					}}
				>
					<div style={{ textAlign: "center", marginBottom: 60 }}>
						<motion.h2
							initial={{ opacity: 0 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							style={{
								color: C.text,
								fontSize: "clamp(32px,4vw,48px)",
								fontWeight: 700,
								letterSpacing: "-0.02em",
							}}
						>
							See <span style={{ color: C.lime }}>DOST</span> in
							Action
						</motion.h2>
					</div>
					<FeatureMarquee />
				</section>

				{/* ── TWO ENGINES (SERVERS) ──────────────────────────────── */}
				<section
					style={{
						background: C.card,
						borderTop: `1px solid ${C.text}08`,
						borderBottom: `1px solid ${C.text}08`,
						padding: "100px 24px",
					}}
				>
					<div style={{ maxWidth: 1100, margin: "0 auto" }}>
						<div style={{ textAlign: "center", marginBottom: 80 }}>
							<Pill color={C.pink}>Default Server Setup</Pill>
							<h2
								style={{
									color: C.text,
									fontSize: "clamp(32px,4vw,48px)",
									fontWeight: 700,
									letterSpacing: "-0.02em",
									marginTop: 20,
								}}
							>
								Simple and{" "}
								<span style={{ color: C.pink }}>Powerful</span>
							</h2>
							<p
								style={{
									color: C.muted,
									fontSize: 18,
									maxWidth: 600,
									margin: "16px auto 0",
								}}
							>
								DOST comes with two default MCP servers designed
								to handle both your local environment and your
								cloud integrations seamlessly.
							</p>
						</div>

						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit,minmax(min(100%, 400px),1fr))",
								gap: 40,
							}}
						>
							{/* Desktop Server */}
							<motion.div
								initial={{ opacity: 0, x: -30 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								style={{
									background: C.bg,
									borderRadius: 24,
									padding: 40,
									border: `1px solid ${C.cyan}20`,
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 16,
										marginBottom: 24,
									}}
								>
									<div
										style={{
											width: 56,
											height: 56,
											borderRadius: 16,
											background: `${C.cyan}18`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<FiMonitor size={28} color={C.cyan} />
									</div>
									<div>
										<h3
											style={{
												color: C.text,
												fontSize: 24,
												fontWeight: 700,
											}}
										>
											Desktop Server
										</h3>
										<p
											style={{
												color: C.cyan,
												fontSize: 14,
												fontWeight: 600,
											}}
										>
											LOCAL STUFF
										</p>
									</div>
								</div>
								<p
									style={{
										color: C.muted,
										fontSize: 16,
										lineHeight: 1.7,
										marginBottom: 24,
									}}
								>
									Your local action engine. It handles
									on-device workflows and system-level tasks.
								</p>
								<ul
									style={{
										listStyle: "none",
										padding: 0,
										margin: 0,
										display: "flex",
										flexDirection: "column",
										gap: 12,
									}}
								>
									{[
										"Launching and managing apps",
										"Window and system controls",
										"Notes, reminders, screenshot, clipboard",
										"Local productivity automation",
									].map((item) => (
										<li
											key={item}
											style={{
												display: "flex",
												alignItems: "center",
												gap: 10,
												color: C.text,
												fontSize: 15,
											}}
										>
											<FiCheckCircle
												color={C.cyan}
												size={18}
											/>{" "}
											{item}
										</li>
									))}
								</ul>
							</motion.div>

							{/* Remote Server */}
							<motion.div
								initial={{ opacity: 0, x: 30 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								style={{
									background: C.bg,
									borderRadius: 24,
									padding: 40,
									border: `1px solid ${C.lime}20`,
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 16,
										marginBottom: 24,
									}}
								>
									<div
										style={{
											width: 56,
											height: 56,
											borderRadius: 16,
											background: `${C.lime}18`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<FiCloud size={28} color={C.lime} />
									</div>
									<div>
										<h3
											style={{
												color: C.text,
												fontSize: 24,
												fontWeight: 700,
											}}
										>
											Remote Server
										</h3>
										<p
											style={{
												color: C.lime,
												fontSize: 14,
												fontWeight: 600,
											}}
										>
											CLOUD STUFF
										</p>
									</div>
								</div>
								<p
									style={{
										color: C.muted,
										fontSize: 16,
										lineHeight: 1.7,
										marginBottom: 24,
									}}
								>
									Your online services engine. It handles
									cloud integrations and fetches live data.
								</p>
								<ul
									style={{
										listStyle: "none",
										padding: 0,
										margin: 0,
										display: "flex",
										flexDirection: "column",
										gap: 12,
									}}
								>
									{[
										"Google Workspace (Gmail, Calendar, Contacts)",
										"Spotify playback and search",
										"Weather, stocks, crypto, metals, currency",
										"Secure OAuth2 authentication layer",
									].map((item) => (
										<li
											key={item}
											style={{
												display: "flex",
												alignItems: "center",
												gap: 10,
												color: C.text,
												fontSize: 15,
											}}
										>
											<FiCheckCircle
												color={C.lime}
												size={18}
											/>{" "}
											{item}
										</li>
									))}
								</ul>
							</motion.div>
						</div>
					</div>
				</section>

				{/* ── FEATURES GRID ──────────────────────────────────────── */}
				<section
					id="features"
					style={{
						maxWidth: 1200,
						margin: "0 auto",
						padding: "120px 24px",
					}}
				>
					<div style={{ textAlign: "center", marginBottom: 70 }}>
						<Pill color={C.cyan}>Comprehensive Capabilities</Pill>
						<h2
							style={{
								color: C.text,
								fontSize: "clamp(32px,4vw,48px)",
								fontWeight: 700,
								letterSpacing: "-0.02em",
								marginTop: 20,
							}}
						>
							Everything You Can Do with{" "}
							<span style={{ color: C.cyan }}>DOST</span>
						</h2>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								"repeat(auto-fit,minmax(min(100%, 320px),1fr))",
							gap: 24,
						}}
					>
						{features.map((f, i) => (
							<FeatureCard key={i} {...f} />
						))}
					</div>
				</section>

				{/* ── REAL WORKFLOWS ─────────────────────────────────────── */}
				<section
					style={{
						background: C.card,
						borderTop: `1px solid ${C.text}08`,
						borderBottom: `1px solid ${C.text}08`,
						padding: "100px 24px",
					}}
				>
					<div style={{ maxWidth: 1000, margin: "0 auto" }}>
						<div style={{ textAlign: "center", marginBottom: 60 }}>
							<Pill color={C.pink}>Built for Real Workflows</Pill>
							<h2
								style={{
									color: C.text,
									fontSize: "clamp(30px,4vw,44px)",
									fontWeight: 700,
									letterSpacing: "-0.02em",
									marginTop: 20,
								}}
							>
								One Request.{" "}
								<span style={{ color: C.pink }}>
									Multiple Actions.
								</span>
							</h2>
							<p
								style={{
									color: C.muted,
									fontSize: 18,
									maxWidth: 600,
									margin: "16px auto 0",
								}}
							>
								DOST handles complex, multi-step prompts by
								chaining tools together intelligently.
							</p>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns:
									"repeat(auto-fit,minmax(min(100%, 400px),1fr))",
								gap: 24,
							}}
						>
							{workflows.map((w, i) => (
								<WorkflowCard key={i} {...w} />
							))}
						</div>
					</div>
				</section>

				{/* ── MCP COMPATIBILITY ──────────────────────────────────── */}
				<section
					style={{
						maxWidth: 1100,
						margin: "0 auto",
						padding: "120px 24px",
					}}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								"repeat(auto-fit,minmax(min(100%, 450px),1fr))",
							gap: 60,
							alignItems: "center",
						}}
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
						>
							<Pill color={C.lime}>MCP Standard</Pill>
							<h2
								style={{
									color: C.text,
									fontSize: "clamp(32px,4vw,48px)",
									fontWeight: 700,
									letterSpacing: "-0.02em",
									margin: "20px 0 24px",
								}}
							>
								Works with{" "}
								<span style={{ color: C.lime }}>Any</span> MCP
								Client
							</h2>
							<p
								style={{
									color: C.muted,
									fontSize: 17,
									lineHeight: 1.7,
									marginBottom: 32,
								}}
							>
								DOST default servers follow the Model Context
								Protocol strictly. This means they are not
								locked to our app. You can use them with any
								MCP-compatible client.
							</p>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr",
									gap: 16,
								}}
							>
								{clients.map(({ icon, label }, i) => (
									<div
										key={i}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											color: C.text,
											fontSize: 15,
											fontWeight: 500,
										}}
									>
										<div style={{ color: C.lime }}>
											{icon}
										</div>
										{label}
									</div>
								))}
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true }}
							style={{
								background: `${C.lime}0a`,
								border: `1px solid ${C.lime}30`,
								borderRadius: 24,
								padding: 40,
								position: "relative",
								overflow: "hidden",
							}}
						>
							<div
								style={{
									position: "absolute",
									top: -50,
									right: -50,
									width: 200,
									height: 200,
									borderRadius: "50%",
									background: `${C.lime}15`,
									filter: "blur(50px)",
								}}
							/>
							<FiLayers
								size={48}
								color={C.lime}
								style={{ marginBottom: 24 }}
							/>
							<h3
								style={{
									fontSize: 24,
									fontWeight: 700,
									color: C.text,
									marginBottom: 16,
								}}
							>
								Add Any Other Server
							</h3>
							<p
								style={{
									color: C.muted,
									fontSize: 16,
									lineHeight: 1.6,
									marginBottom: 24,
								}}
							>
								DOST is designed to grow with your needs. Keep
								it future-ready and highly extensible by adding
								more servers anytime.
							</p>
							<div
								style={{
									display: "flex",
									gap: 10,
									flexWrap: "wrap",
								}}
							>
								{[
									"Databases & Analytics",
									"CRM Systems",
									"Internal APIs",
									"DevOps Workflows",
								].map((tag) => (
									<span
										key={tag}
										style={{
											background: `${C.bg}80`,
											color: C.text,
											border: `1px solid ${C.lime}30`,
											borderRadius: 8,
											padding: "8px 16px",
											fontSize: 13,
											fontWeight: 600,
										}}
									>
										{tag}
									</span>
								))}
							</div>
						</motion.div>
					</div>
				</section>

				{/* ── CTA ────────────────────────────────────────────────── */}
				<section id="contact" style={{ padding: "0 24px 120px" }}>
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						style={{
							maxWidth: 800,
							margin: "0 auto",
							textAlign: "center",
							background: C.card,
							border: `1px solid ${C.cyan}30`,
							borderRadius: 32,
							padding: "80px 40px",
							position: "relative",
							overflow: "hidden",
							boxShadow: `0 20px 80px ${C.cyan}10`,
						}}
					>
						<div
							style={{
								position: "absolute",
								top: -100,
								right: -100,
								width: 300,
								height: 300,
								borderRadius: "50%",
								background: `${C.lime}15`,
								filter: "blur(80px)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								bottom: -100,
								left: -100,
								width: 300,
								height: 300,
								borderRadius: "50%",
								background: `${C.pink}15`,
								filter: "blur(80px)",
							}}
						/>

						<h2
							style={{
								color: C.text,
								fontSize: "clamp(36px,5vw,56px)",
								fontWeight: 700,
								letterSpacing: "-0.03em",
								margin: "0 0 24px",
								position: "relative",
							}}
						>
							Your App. Your Model.
							<br />
							<span style={{ color: C.cyan }}>Your Keys.</span>
						</h2>
						<p
							style={{
								color: C.muted,
								fontSize: 18,
								lineHeight: 1.6,
								maxWidth: 500,
								margin: "0 auto 40px",
								position: "relative",
							}}
						>
							Completely free and open source. Start with default
							servers, choose your AI provider, and maintain full
							control over your workflow.
						</p>
						<div
							style={{
								display: "flex",
								gap: 16,
								justifyContent: "center",
								flexWrap: "wrap",
								position: "relative",
							}}
						>
							<Link href="/signup">
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									style={{
										background: C.cyan,
										color: C.bg,
										borderRadius: 9999,
										padding: "16px 40px",
										fontWeight: 700,
										fontSize: 16,
										border: "none",
										cursor: "pointer",
										boxShadow: `0 0 30px ${C.cyan}40`,
									}}
								>
									Get DOST Now
								</motion.button>
							</Link>
						</div>
					</motion.div>
				</section>

				{/* ── FOOTER ─────────────────────────────────────────────── */}
				<footer
					style={{
						borderTop: `1px solid ${C.text}10`,
						padding: "40px 24px",
						background: C.card,
					}}
				>
					<div
						style={{
							maxWidth: 1200,
							margin: "0 auto",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: 24,
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
							}}
						>
							<div
								style={{
									width: 36,
									height: 36,
									borderRadius: 12,
									background: C.cyan,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: `0 0 16px ${C.cyan}40`,
								}}
							>
								<FiZap size={18} color={C.bg} />
							</div>
							<div>
								<span
									style={{
										color: C.text,
										fontWeight: 700,
										fontSize: 18,
										display: "block",
										lineHeight: 1,
									}}
								>
									DOST
								</span>
								<span style={{ color: C.muted, fontSize: 12 }}>
									Agentic AI Assistant
								</span>
							</div>
						</div>
						<div style={{ display: "flex", gap: 32 }}>
							<Link
								href="/docs"
								style={{
									color: C.muted,
									fontSize: 14,
									fontWeight: 500,
									textDecoration: "none",
									transition: "color 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.target.style.color = C.cyan)
								}
								onMouseLeave={(e) =>
									(e.target.style.color = C.muted)
								}
							>
								Documentation
							</Link>
							<a
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: C.muted,
									fontSize: 14,
									fontWeight: 500,
									textDecoration: "none",
									transition: "color 0.2s",
								}}
								onMouseEnter={(e) =>
									(e.target.style.color = C.cyan)
								}
								onMouseLeave={(e) =>
									(e.target.style.color = C.muted)
								}
							>
								GitHub Repository
							</a>
						</div>
					</div>
				</footer>
			</main>
		</>
	);
}
