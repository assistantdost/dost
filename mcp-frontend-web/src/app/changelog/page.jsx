"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCommit, Tag, Clock, ChevronRight } from "lucide-react";

export default function ChangelogPage() {
	const releases = [
		{
			version: "v0.1.0-beta",
			title: "OAuth2 Cloud Connections & Desktop Automation",
			date: "May 2026",
			status: "latest",
			changes: [
				"Implemented Google Workspace OAuth authentication flow supporting secure reading/writing of Gmail, Google Calendar events, and Google Contacts.",
				"Added Spotify Web Player OAuth integration to swap active playback devices, search contents, skip tracks, and toggle states via AI agents.",
				"Introduced User Dashboard API Keys segment to generate and manage custom authorization tokens for remote MCP client integrations.",
				"Added desktop control binaries to automate adjustments of screen brightness, master speaker volume, screenshots, and active windows focus.",
				"Integrated Sonner toast notification systems and custom OAuth2 validation protocols on backend servers."
			]
		},
		{
			version: "v0.0.9-alpha",
			title: "Model Context Protocol Integration & Core Shell",
			date: "April 2026",
			status: "previous",
			changes: [
				"Adopted the standardized Model Context Protocol JSON-RPC scheme for Desktop Server actions (stdio transport).",
				"Completed standard Next.js 16 frontend app routing, local middleware configurations, and state storage engines via Zustand.",
				"Setup OAuth route handshakes and token exchange endpoints inside remote server companion modules.",
				"Configured secure local system scripting boundaries to prevent arbitrary execution on client machines."
			]
		}
	];

	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-4xl space-y-8">
				{/* Header */}
				<div className="text-center md:text-left border-b border-border/60 pb-6">
					<Badge variant="outline" className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full">
						Timeline
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">Changelog & Updates</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Stay up to date with the latest features, security patches, and releases of the DOST platform.
					</p>
				</div>

				{/* Timeline wrapper */}
				<div className="relative border-l border-border/80 pl-6 ml-4 md:pl-8 md:ml-6 space-y-12">
					{releases.map((release, idx) => (
						<div key={release.version} className="relative">
							{/* Node dot */}
							<span className={`absolute -left-[31px] md:-left-[39px] top-1.5 flex h-4 w-4 rounded-full border-2 ${
								release.status === "latest" 
									? "bg-primary border-primary animate-pulse" 
									: "bg-background border-muted-foreground"
							}`} />

							<div className="space-y-4">
								<div className="flex flex-wrap items-center gap-2">
									<Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
										release.status === "latest"
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground border-border"
									}`}>
										<Tag className="h-2.5 w-2.5 mr-1 inline" /> {release.version}
									</Badge>
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<Clock className="h-3 w-3" /> {release.date}
									</span>
								</div>

								<Card className="border-border bg-card shadow-sm">
									<CardHeader className="pb-3">
										<CardTitle className="text-base font-semibold">{release.title}</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<ul className="space-y-2.5">
											{release.changes.map((change, cIdx) => (
												<li key={cIdx} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed">
													<ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
													<span>{change}</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
