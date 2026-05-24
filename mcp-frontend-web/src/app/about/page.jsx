"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, Layers, Cpu, ShieldCheck, Heart, Github } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-4xl space-y-8">
				{/* Header */}
				<div className="text-center md:text-left border-b border-border/60 pb-6">
					<Badge variant="outline" className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full">
						Overview
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">About DOST</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Discover the mission, architecture, and technology stack powering the DOST-MCP system.
					</p>
				</div>

				{/* Two Column details */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
					{/* Card 1: Core Mission */}
					<Card className="border-border bg-card shadow-sm flex flex-col justify-between">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<Cpu className="h-5 w-5" />
							</div>
							<CardTitle className="text-lg">Core Mission</CardTitle>
							<CardDescription>A personal control center for your digital environment.</CardDescription>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground leading-relaxed space-y-3">
							<p>
								DOST was created to bridge the gap between static LLM chats and active environments. Most assistants answer questions, but they can't adjust your speaker volume, check your calendars, skip your Spotify music tracks, or launch programs.
							</p>
							<p>
								Using the standardized **Model Context Protocol (MCP)**, DOST establishes structured actions, schemas, and transport frameworks that any LLM client (Cursor, Claude Desktop, Electron Apps, CLI companions) can bind to safely.
							</p>
						</CardContent>
					</Card>

					{/* Card 2: Security & Privacy */}
					<Card className="border-border bg-card shadow-sm flex flex-col justify-between">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<ShieldCheck className="h-5 w-5" />
							</div>
							<CardTitle className="text-lg">Security & Privacy</CardTitle>
							<CardDescription>Your credentials, completely under your own control.</CardDescription>
						</CardHeader>
						<CardContent className="text-xs md:text-sm text-muted-foreground leading-relaxed space-y-3">
							<p>
								DOST operates locally by default. The **Desktop Server** runs on-device, handling system-level execution boundaries safely. Commands are processed locally, and clipboard content never leaves your network.
							</p>
							<p>
								For remote cloud operations (like Google Workspace and Spotify), DOST uses standardized OAuth2 authentication. Your tokens are stored securely on your own server instance.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Architecture Section */}
				<Card className="border-border bg-card shadow-sm">
					<CardHeader>
						<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
							<Layers className="h-5 w-5" />
						</div>
						<CardTitle className="text-base font-bold">System Architecture</CardTitle>
						<CardDescription>The modular pieces that construct DOST.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
							DOST is built on open-source standards. The system consists of three independent nodes:
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="p-3 border border-border/80 rounded-lg bg-muted/20">
								<h4 className="text-xs font-bold text-foreground">1. Next.js Web Dashboard</h4>
								<p className="text-[11px] text-muted-foreground mt-1">Manage API keys, profile settings, and OAuth authorizations.</p>
							</div>
							<div className="p-3 border border-border/80 rounded-lg bg-muted/20">
								<h4 className="text-xs font-bold text-foreground">2. Desktop Server (Local)</h4>
								<p className="text-[11px] text-muted-foreground mt-1">Stdio transport daemon coordinating desktop app launch and OS controls.</p>
							</div>
							<div className="p-3 border border-border/80 rounded-lg bg-muted/20">
								<h4 className="text-xs font-bold text-foreground">3. Remote Server (Cloud)</h4>
								<p className="text-[11px] text-muted-foreground mt-1">WS/SSE endpoint managing secure external APIs (Gmail, Spotify).</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Open Source Footer Card */}
				<Card className="border border-primary/30 bg-primary/5 p-6 text-center rounded-xl space-y-4">
					<div className="flex justify-center gap-1.5 text-primary">
						<Heart className="h-5 w-5 fill-current" />
						<span className="text-sm font-bold uppercase tracking-wider">MIT Licensed</span>
					</div>
					<h3 className="text-lg font-bold">Proudly Open Source</h3>
					<p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
						DOST is fully free, open-source, and available on GitHub. Bring your own keys, choose your models, and host your own servers with total freedom.
					</p>
					<div className="flex justify-center">
						<Button asChild size="sm" className="rounded-full px-6 font-semibold shadow-md">
							<a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
								<Github className="h-4 w-4" /> View GitHub Repo
							</a>
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
