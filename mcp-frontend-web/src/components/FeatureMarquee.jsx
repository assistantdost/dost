"use client";

import { Marquee } from "@/components/ui/marquee";
import { Card } from "@/components/ui/card";
import {
	Monitor,
	Calendar,
	Music,
	TrendingUp,
	Volume2,
	Cloud,
	Terminal,
	Mail,
	Layout,
	Cpu,
	GitBranch,
	Plus
} from "lucide-react";

const marqueeFeatures = [
	{
		icon: <Monitor className="h-5 w-5" />,
		text: "Desktop Automation",
		desc: "Control windows, volume & local apps",
	},
	{
		icon: <Calendar className="h-5 w-5" />,
		text: "Google Calendar Sync",
		desc: "Read and create meetings directly",
	},
	{
		icon: <Music className="h-5 w-5" />,
		text: "Spotify Playback",
		desc: "Play music, skip tracks, switch devices",
	},
	{
		icon: <TrendingUp className="h-5 w-5" />,
		text: "Live Stock Prices",
		desc: "Get real-time market data instantly",
	},
	{
		icon: <Volume2 className="h-5 w-5" />,
		text: "System Controls",
		desc: "Adjust audio volume & screen brightness",
	},
	{
		icon: <Cloud className="h-5 w-5" />,
		text: "Live Weather",
		desc: "Check current conditions & forecast",
	},
	{
		icon: <Terminal className="h-5 w-5" />,
		text: "Terminal Execution",
		desc: "Run background scripts natively",
	},
	{
		icon: <Mail className="h-5 w-5" />,
		text: "Send Emails",
		desc: "Draft and send via Google Workspace",
	},
	{
		icon: <Layout className="h-5 w-5" />,
		text: "Window Management",
		desc: "Organize open applications",
	},
	{
		icon: <Cpu className="h-5 w-5" />,
		text: "Crypto Trends",
		desc: "Fetch live token prices & trends",
	},
	{
		icon: <GitBranch className="h-5 w-5" />,
		text: "Tool Selection",
		desc: "Semantic search picks the right tool",
	},
	{
		icon: <Plus className="h-5 w-5" />,
		text: "And Many More...",
		desc: "Limitless extensibility with MCP",
	},
];

function MarqueeFeatureCard({ icon, text, desc }) {
	return (
		<Card className="flex w-[280px] shrink-0 flex-col gap-2 p-5 border-border bg-card hover:bg-accent/40 hover:border-accent transition-all duration-300">
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center rounded-lg bg-primary/10 p-2 text-primary">
					{icon}
				</div>
				<span className="font-semibold text-sm text-foreground">{text}</span>
			</div>
			<p className="text-xs text-muted-foreground leading-relaxed mt-1">
				{desc}
			</p>
		</Card>
	);
}

export default function FeatureMarquee() {
	return (
		<div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
			<Marquee pauseOnHover className="[--duration:50s]">
				{marqueeFeatures.slice(0, 6).map((feat, i) => (
					<MarqueeFeatureCard key={i} {...feat} />
				))}
			</Marquee>
			<Marquee reverse pauseOnHover className="[--duration:50s] mt-4">
				{marqueeFeatures.slice(6).map((feat, i) => (
					<MarqueeFeatureCard key={`rev-${i}`} {...feat} />
				))}
			</Marquee>
			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent z-10"></div>
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent z-10"></div>
		</div>
	);
}
