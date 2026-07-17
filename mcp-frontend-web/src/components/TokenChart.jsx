"use client";

import React, { useState, useEffect } from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";

const data = [
	{ turn: "Turn 1", unoptimized: 25000, optimized: 2500 },
	{ turn: "Turn 2", unoptimized: 50000, optimized: 4500 },
	{ turn: "Turn 3", unoptimized: 75000, optimized: 4500 },
	{ turn: "Turn 4", unoptimized: 85000, optimized: 4500 },
	{ turn: "Turn 5", unoptimized: 95000, optimized: 4500 },
	{ turn: "Turn 6", unoptimized: 100000, optimized: 4500 },
	{ turn: "Turn 7", unoptimized: 105000, optimized: 4500 },
	{ turn: "Turn 8", unoptimized: 110000, optimized: 4500 },
	{ turn: "Turn 9", unoptimized: 115000, optimized: 4500 },
	{ turn: "Turn 10", unoptimized: 120000, optimized: 4500 },
];

const chartConfig = {
	unoptimized: {
		label: "Unoptimized Loop",
		color: "#ef4444",
	},
	optimized: {
		label: "DOST Bounded Loop",
		color: "#10b981",
	},
};

const CustomTooltip = ({ active, payload }) => {
	if (active && payload && payload.length) {
		return (
			<div className="rounded-xl border border-border bg-card p-4 shadow-lg text-xs leading-relaxed">
				<p className="font-bold text-foreground mb-2">
					{payload[0].payload.turn}
				</p>
				<div className="space-y-1.5">
					<div className="flex items-center justify-between gap-6 text-red-500">
						<span className="flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-red-500" />
							Unoptimized:
						</span>
						<span className="font-mono font-bold">
							{payload[0].value.toLocaleString()} tokens
						</span>
					</div>
					<div className="flex items-center justify-between gap-6 text-emerald-500">
						<span className="flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-emerald-500" />
							DOST Bounded:
						</span>
						<span className="font-mono font-bold">
							{payload[1].value.toLocaleString()} tokens
						</span>
					</div>
					<div className="pt-2 border-t border-border mt-1 flex items-center justify-between text-muted-foreground">
						<span>Difference:</span>
						<span className="font-mono font-bold text-primary">
							{`${(payload[0].value - payload[1].value).toLocaleString()} fewer`}
						</span>
					</div>
				</div>
			</div>
		);
	}
	return null;
};

export default function TokenChart() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="h-[400px] w-full flex items-center justify-center bg-card border border-border/60 rounded-2xl animate-pulse">
				<span className="text-sm text-muted-foreground">
					Loading chart data...
				</span>
			</div>
		);
	}

	return (
		<Card className="pt-0 border-border bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden h-[400px] flex flex-col justify-between">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b border-border/60 py-4 sm:flex-row justify-between">
				<div className="grid flex-1 gap-0.5 text-left">
					<CardTitle className="text-sm font-bold text-foreground">
						Context Load Comparison
					</CardTitle>
					<CardDescription className="text-xs text-muted-foreground">
						Comparing cumulative agent turns vs DOST optimization.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className=" pt-4 sm:px-6 sm:pt-6 flex-1 flex flex-col justify-between">
				<div className="flex-1 w-full h-[320px] text-[11px]">
					<ChartContainer config={chartConfig} className="w-full h-full">
						<AreaChart
							data={data}
							margin={{
								top: 10,
								right: 10,
								left: -20,
								bottom: 0,
							}}
						>
							<defs>
								<linearGradient
									id="colorUnoptimized"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="#ef4444"
										stopOpacity={0.2}
									/>
									<stop
										offset="95%"
										stopColor="#ef4444"
										stopOpacity={0.01}
									/>
								</linearGradient>
								<linearGradient
									id="colorOptimized"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="#10b981"
										stopOpacity={0.2}
									/>
									<stop
										offset="95%"
										stopColor="#10b981"
										stopOpacity={0.01}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-border/40"
								vertical={false}
							/>
							<XAxis
								dataKey="turn"
								className="fill-muted-foreground stroke-none"
								tickLine={false}
								axisLine={false}
								dy={10}
							/>
							<YAxis
								className="fill-muted-foreground stroke-none"
								tickLine={false}
								axisLine={false}
								dx={-10}
								tickFormatter={(value) => {
									if (value >= 1000)
										return `${value / 1000}k`;
									return value;
								}}
							/>
							<Tooltip
								content={<CustomTooltip />}
								cursor={{ stroke: "rgba(var(--border), 0.2)" }}
							/>
							<Area
								type="monotone"
								dataKey="unoptimized"
								stroke="#ef4444"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#colorUnoptimized)"
							/>
							<Area
								type="monotone"
								dataKey="optimized"
								stroke="#10b981"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#colorOptimized)"
							/>
							<ChartLegend content={<ChartLegendContent />} />
						</AreaChart>
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	);
}
