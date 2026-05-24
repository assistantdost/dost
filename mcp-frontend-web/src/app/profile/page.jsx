export const dynamic = "force-dynamic";

import { getServerFetcher } from "@/lib/serverApi";
import { getMe } from "@/api/user";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, CheckCircle2, XCircle, ChevronRight, Zap } from "lucide-react";

async function getProfileData() {
	try {
		const fetcher = await getServerFetcher();
		const userData = await getMe(fetcher);
		return {
			user: userData?.user || null,
		};
	} catch (error) {
		console.error("Profile data fetch failed:", error);
		return { user: null };
	}
}

export default async function ProfilePage() {
	const { user } = await getProfileData();

	if (!user) {
		return (
			<div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 pt-24 font-sans">
				<div className="max-w-md w-full text-center space-y-4 border border-border bg-card p-8 rounded-xl shadow-lg">
					<XCircle className="h-12 w-12 text-destructive mx-auto" />
					<h1 className="text-xl font-bold">Authentication Required</h1>
					<p className="text-sm text-muted-foreground">
						You need to be logged in to view your profile settings.
					</p>
					<Button asChild className="w-full rounded-lg">
						<Link href="/login">Go to Login</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Simulated connection statuses based on user roles or workspace setups
	const integrations = [
		{
			name: "Google Workspace",
			description: "Gmail, Calendar, Contacts read/write permission",
			connected: true,
			scopes: ["gmail.readonly", "calendar.events", "contacts.readonly"],
		},
		{
			name: "Spotify",
			description: "Player control, search tracks, active playback device swap",
			connected: false,
			scopes: ["user-modify-playback-state", "user-read-playback-state"],
		},
	];

	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-4xl space-y-8">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
						<p className="text-sm text-muted-foreground mt-1">Manage your account information and integrations.</p>
					</div>
					<Badge variant="outline" className="rounded-full px-3 py-1 bg-primary/10 border-primary text-primary text-xs font-semibold">
						<Zap className="h-3 w-3 mr-1 fill-current" /> Active Session
					</Badge>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Left column: User identity */}
					<div className="md:col-span-1">
						<Card className="border-border bg-card shadow-sm h-full">
							<CardHeader className="text-center pb-2">
								<div className="h-20 w-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary text-2xl font-bold">
									{user.name?.charAt(0).toUpperCase()}
								</div>
								<CardTitle className="text-lg mt-4">{user.name}</CardTitle>
								<CardDescription className="text-xs uppercase font-semibold text-muted-foreground/75 tracking-wider">
									{user.role || "User"}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 pt-4 border-t border-border/60">
								<div className="space-y-1">
									<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Email Address</span>
									<div className="flex items-center gap-2 text-xs text-foreground font-medium truncate">
										<Mail className="h-3.5 w-3.5 text-muted-foreground" />
										<span>{user.email}</span>
									</div>
								</div>
								<div className="space-y-1">
									<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Access Permissions</span>
									<div className="flex items-center gap-2 text-xs text-foreground font-medium">
										<Shield className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="capitalize">{user.role} Privilege</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right column: Details and Integrations */}
					<div className="md:col-span-2 space-y-6">
						{/* Account info card */}
						<Card className="border-border bg-card shadow-sm">
							<CardHeader>
								<CardTitle className="text-base">System Access</CardTitle>
								<CardDescription>Verify your API keys and desktop agent credentials.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="p-4 border border-border/80 rounded-lg bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div>
										<h4 className="text-sm font-semibold">Personal API Keys</h4>
										<p className="text-xs text-muted-foreground mt-1">Authorized access keys generated for custom MCP clients.</p>
									</div>
									<Button asChild variant="outline" size="sm" className="rounded-lg h-9">
										<Link href="/dashboard">Manage Keys <ChevronRight className="h-3 w-3 ml-1" /></Link>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Integrations card */}
						<Card className="border-border bg-card shadow-sm">
							<CardHeader>
								<CardTitle className="text-base font-bold">Cloud Connected Integrations</CardTitle>
								<CardDescription>OAuth credentials authorized on your remote cloud server.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{integrations.map((item) => (
									<div key={item.name} className="p-4 border border-border/80 rounded-lg bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<h4 className="text-sm font-semibold">{item.name}</h4>
												{item.connected ? (
													<Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-[10px] font-bold py-0 rounded-full">
														<CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" /> Authorized
													</Badge>
												) : (
													<Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] font-bold py-0 rounded-full">
														Not Connected
													</Badge>
												)}
											</div>
											<p className="text-xs text-muted-foreground">{item.description}</p>
											<div className="flex flex-wrap gap-1.5 pt-1.5">
												{item.scopes.map(s => (
													<code key={s} className="text-[10px] bg-muted/60 border border-border/60 px-1 py-0.5 rounded text-muted-foreground">{s}</code>
												))}
											</div>
										</div>
										{!item.connected && (
											<Button size="sm" className="rounded-lg h-9 font-semibold">
												Connect Account
											</Button>
										)}
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
