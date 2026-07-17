"use client";

import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ContextBreakdown() {
	return (
		<TooltipProvider delayDuration={100}>
			<Card className="pt-0 border-border bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden mt-6">
				<CardHeader className="py-4 border-b border-border/60 text-left">
					<CardTitle className="text-sm font-bold text-foreground">
						Anatomy of a Single Request Context
					</CardTitle>
					<CardDescription className="text-xs text-muted-foreground">
						Visualizing token distribution inside the LLM prompt payload.
					</CardDescription>
				</CardHeader>

				<CardContent className="p-6 space-y-6">
					{/* Unoptimized stack */}
					<div className="space-y-2 text-left">
						<div className="flex justify-between text-xs font-semibold">
							<span className="text-red-500">Unoptimized Agentic Loop</span>
							<span className="font-mono text-muted-foreground">120,000 tokens</span>
						</div>
						<div className="h-6 w-full rounded-lg overflow-hidden flex bg-muted border border-border/40">
							{/* System (0.8%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-blue-500 hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
										style={{ width: "0.8%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									System Instructions: 1,000 tokens
								</TooltipContent>
							</Tooltip>

							{/* Tool Schemas (15.0%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-purple-500 hover:bg-purple-600 transition-colors duration-200 border-l border-background/20 cursor-pointer"
										style={{ width: "15.0%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									All 50+ Tool Schemas: 18,000 tokens
								</TooltipContent>
							</Tooltip>

							{/* Raw History (84.2%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-rose-500 hover:bg-rose-600 transition-colors duration-200 border-l border-background/20 cursor-pointer"
										style={{ width: "84.2%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									Raw Chat History: 101,000 tokens
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					{/* DOST Stack */}
					<div className="space-y-2 text-left">
						<div className="flex justify-between text-xs font-semibold">
							<span className="text-emerald-500 font-bold">DOST Bounded Loop</span>
							<span className="font-mono text-emerald-500 font-bold">4,500 tokens</span>
						</div>
						<div className="h-6 w-full rounded-lg overflow-hidden flex bg-muted border border-border/40">
							{/* System (22.2%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-blue-500 hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
										style={{ width: "22.2%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									System Instructions: 1,000 tokens
								</TooltipContent>
							</Tooltip>

							{/* Tool RAG (26.7%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-purple-500 hover:bg-purple-600 transition-colors duration-200 border-l border-background/20 cursor-pointer"
										style={{ width: "26.7%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									Tool RAG (3 dynamic schemas): 1,200 tokens
								</TooltipContent>
							</Tooltip>

							{/* Summary (33.3%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-emerald-500 hover:bg-emerald-600 transition-colors duration-200 border-l border-background/20 cursor-pointer"
										style={{ width: "33.3%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									System Summary Checkpoint: 1,500 tokens
								</TooltipContent>
							</Tooltip>

							{/* Slide window (17.8%) */}
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="h-full bg-amber-500 hover:bg-amber-600 transition-colors duration-200 border-l border-background/20 cursor-pointer"
										style={{ width: "17.8%" }}
									/>
								</TooltipTrigger>
								<TooltipContent>
									Chat Slide Window (Last 2 turns): 800 tokens
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					{/* Legends */}
					<div className="flex flex-wrap gap-x-6 gap-y-4 border-t border-border/40 pt-4 text-[11px] font-semibold text-left justify-start">
						<div className="flex items-start gap-2 min-w-[120px]">
							<span className="h-3 w-3 rounded bg-blue-500 shrink-0 mt-0.5" />
							<div>
								<div className="font-bold text-foreground">System Prompt</div>
								<div className="text-muted-foreground text-[10px]">1,000 tokens (fixed)</div>
							</div>
						</div>
						<div className="flex items-start gap-2 min-w-[120px]">
							<span className="h-3 w-3 rounded bg-purple-500 shrink-0 mt-0.5" />
							<div>
								<div className="font-bold text-foreground">Tool Schemas</div>
								<div className="text-muted-foreground text-[10px]">3 active vs. 50+ total</div>
							</div>
						</div>
						<div className="flex items-start gap-2 min-w-[120px]">
							<span className="h-3 w-3 rounded bg-emerald-500 shrink-0 mt-0.5" />
							<div>
								<div className="font-bold text-foreground">System Summary</div>
								<div className="text-muted-foreground text-[10px]">Dense historical state</div>
							</div>
						</div>
						<div className="flex items-start gap-2 min-w-[120px]">
							<span className="h-3 w-3 rounded bg-amber-500 shrink-0 mt-0.5" />
							<div>
								<div className="font-bold text-foreground">Slide Window</div>
								<div className="text-muted-foreground text-[10px]">Last 2 turns raw</div>
							</div>
						</div>
						<div className="flex items-start gap-2 min-w-[120px]">
							<span className="h-3 w-3 rounded bg-rose-500 shrink-0 mt-0.5" />
							<div>
								<div className="font-bold text-foreground">Raw Chat History</div>
								<div className="text-muted-foreground text-[10px]">Unbounded history turns</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</TooltipProvider>
	);
}
