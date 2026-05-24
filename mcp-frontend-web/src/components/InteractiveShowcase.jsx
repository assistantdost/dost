"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
	{
		image: "/placeholder_analytics.png",
		title: "Real-time AI Analytics",
		description: "Monitor agent behavior, tool execution times, and token cost metrics instantly.",
	},
	{
		image: "/placeholder_automation.png",
		title: "Visual Workflow Designer",
		description: "Map agentic workflows and tool connections with an intuitive visual node-editor interface.",
	},
	{
		image: "/placeholder_integrations.png",
		title: "Native Integrations Library",
		description: "Connect standard cloud APIs like Spotify, Google Calendar, and Slack in a single click.",
	},
	{
		image: "/placeholder_terminal.png",
		title: "Interactive System Console",
		description: "Securely run terminal scripts, background binaries, and command executions.",
	},
];

export default function InteractiveShowcase() {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setIndex((prev) => (prev + 1) % slides.length);
		}, 5000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="flex flex-col gap-4 w-full">
			{/* Image Frame */}
			<div className="relative w-full aspect-[16/10] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
				{/* Sliding/Fading Image */}
				<div className="relative w-full h-full">
					<AnimatePresence mode="wait">
						<motion.div
							key={index}
							initial={{ opacity: 0, scale: 0.98 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.5, ease: "easeInOut" }}
							className="absolute inset-0 w-full h-full"
						>
							<Image
								src={slides[index].image}
								alt={slides[index].title}
								fill
								priority
								className="object-cover"
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>

			{/* Details & Controls */}
			<div className="flex justify-between items-center mt-2 px-1">
				<div className="flex flex-col gap-1 text-left max-w-[80%]">
					<motion.h3
						key={`title-${index}`}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="text-sm font-bold tracking-tight text-foreground"
					>
						{slides[index].title}
					</motion.h3>
					<motion.p
						key={`desc-${index}`}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.05 }}
						className="text-xs text-muted-foreground leading-normal"
					>
						{slides[index].description}
					</motion.p>
				</div>

				{/* Dot indicators */}
				<div className="flex gap-1.5 shrink-0">
					{slides.map((_, i) => (
						<button
							key={i}
							onClick={() => setIndex(i)}
							className={`h-2 w-2 rounded-full transition-all duration-300 ${
								i === index ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
							}`}
							aria-label={`Go to slide ${i + 1}`}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
