"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";

const slides = [
	{
		image: "/client/home_page.png",
		title: "Intuitive Home Dashboard",
		description:
			"Get an overview of your assistant's system status, active providers, and quick actions in a clean, modern layout.",
	},
	{
		image: "/client/chat_interface.png",
		title: "Conversational Agent",
		description:
			"Interact naturally with your assistant, track step-by-step reasoning processes, and see execution details for each action.",
	},
	{
		image: "/client/mcp_control_center.png",
		title: "MCP Control Center",
		description:
			"Manage and monitor local stdio and remote HTTP/SSE Model Context Protocol servers in one centralized panel.",
	},
	{
		image: "/client/model_selection.png",
		title: "Dynamic Model Selection",
		description:
			"Switch dynamically between different LLMs from Groq, Google Gemini, or local endpoints to optimize for speed or intelligence.",
	},
	{
		image: "/client/bring_your_own_keys.png",
		title: "Bring Your Own Keys",
		description:
			"Keep your credentials safe. Input and configure your own API keys locally for model providers and connected platforms.",
	},
	{
		image: "/client/mermaid_support.png",
		title: "Mermaid Diagram Support",
		description:
			"Render and interact with flowcharts, sequence diagrams, and architectures generated dynamically by the AI.",
	},
	{
		image: "/client/maths_support.png",
		title: "LaTeX Mathematical Support",
		description:
			"View and read complex math equations and scientific notations typeset beautifully in LaTeX and KaTeX.",
	},
];

export default function InteractiveShowcase() {
	const [index, setIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (isPaused || isOpen) return;
		const timer = setInterval(() => {
			setIndex((prev) => (prev + 1) % slides.length);
		}, 5000);
		return () => clearInterval(timer);
	}, [isPaused, isOpen]);

	return (
		<div className="flex flex-col gap-4 w-full">
			{/* Image Frame */}
			<div
				className="relative w-full aspect-16/9 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden cursor-zoom-in group"
				onMouseEnter={() => setIsPaused(true)}
				onMouseLeave={() => setIsPaused(false)}
				onClick={() => setIsOpen(true)}
			>
				{/* Sliding/Fading Image */}
				<div className="relative w-full h-full">
					{slides.map((slide, i) => (
						<div
							key={i}
							className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${
								i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
							}`}
						>
							<Image
								src={slide.image}
								alt={slide.title}
								fill
								priority={true}
								className="object-cover"
							/>
						</div>
					))}
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
								i === index
									? "bg-primary w-4"
									: "bg-muted-foreground/30 hover:bg-muted-foreground/50"
							}`}
							aria-label={`Go to slide ${i + 1}`}
						/>
					))}
				</div>
			</div>

			{/* Shadcn Modal for Large Expanded View */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-5xl bg-card border-border p-2 md:p-6 rounded-2xl gap-4">
					<DialogHeader className="mb-2 flex flex-col gap-1">
						<DialogTitle className="text-lg font-bold tracking-tight text-foreground">
							{slides[index].title}
						</DialogTitle>
						<DialogDescription className="text:sm md:text-lg text-muted-foreground">
							{slides[index].description}
						</DialogDescription>
					</DialogHeader>
					<div className="relative w-full aspect-16/9 rounded-lg overflow-hidden border border-border/40 bg-muted/20">
						<Image
							src={slides[index].image}
							alt={slides[index].title}
							fill
							quality={100}
							unoptimized
							className="object-contain"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
