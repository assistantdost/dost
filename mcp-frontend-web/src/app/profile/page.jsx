export const dynamic = "force-dynamic";

import { serverApi } from "@/lib/serverApi";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Terminal, Shield, Mail, User } from "lucide-react";
import APIKeysSection from "@/components/dashboard/APIKeysSection";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { getServerFetcher } from "@/lib/serverApi";
import { getMe } from "@/api/user";
import { getAPIKeys } from "@/api/apiKeys";
import { notFound } from "next/navigation";

async function getProfileData() {
	try {
		const fetcher = await getServerFetcher();
		const [userData, apiKeysData] = await Promise.all([
			getMe(fetcher),
			getAPIKeys(fetcher),
		]);
		return {
			user: userData.user,
			initialApiKeys: apiKeysData.api_keys,
		};
	} catch (error) {
		console.error("Profile data fetch failed:", error);
		return { user: null, initialApiKeys: [] };
	}
}

export default async function ProfilePage() {
	const isProd = process.env.NEXT_PUBLIC_MODE === "prod";
	if (isProd) {
		notFound();
	}

	const { user, initialApiKeys } = await getProfileData();

	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-6 font-sans">
				<div className="max-w-md w-full text-center space-y-4 border border-border bg-card p-8 rounded-xl shadow-lg">
					<h1 className="text-xl font-bold">Session Required</h1>
					<p className="text-sm text-muted-foreground">
						Failed to load profile data. Please try logging in again.
					</p>
					<Button asChild className="w-full rounded-lg">
						<Link href="/login">Go to Login</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-4xl space-y-8">
				{/* Welcome Header */}
				<div className="border-b border-border/60 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Manage credentials, monitor connections, and view profile overview.
						</p>
					</div>
					<LogoutButton />
				</div>

				{/* Profile Overview Card (Full Width) */}
				<Card className="border-border bg-card shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-base font-bold">Profile Overview</CardTitle>
						<CardDescription>Your account credentials and system privileges.</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-0">
						<div className="space-y-1">
							<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Name</span>
							<div className="flex items-center gap-2 text-sm font-semibold">
								<User className="h-4 w-4 text-primary shrink-0" />
								<span>{user.name}</span>
							</div>
						</div>
						<div className="space-y-1">
							<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Email</span>
							<div className="flex items-center gap-2 text-sm font-semibold truncate">
								<Mail className="h-4 w-4 text-primary shrink-0" />
								<span>{user.email}</span>
							</div>
						</div>
						<div className="space-y-1">
							<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Role / Privilege</span>
							<div className="flex items-center gap-2 text-sm font-semibold capitalize">
								<Shield className="h-4 w-4 text-primary shrink-0" />
								<span>{user.role || "User"}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* API Keys Manager */}
				<APIKeysSection initialData={initialApiKeys} />

				{/* Quick Connect Guide (Full Width) */}
				<Card className="border border-primary/20 bg-primary/5 shadow-sm">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2 text-primary">
							<Terminal className="h-5 w-5" />
							<CardTitle className="text-sm font-bold uppercase tracking-wider">Remote MCP Authentication Guide</CardTitle>
						</div>
						<CardDescription className="text-xs text-muted-foreground">
							Authenticate your remote MCP server to authorize weather, finance, Google Workspace, and Spotify tools.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
						<p>
							1. Generate a personal API access key above and copy the generated token.
						</p>
						<p>
							2. Use this token for Remote MCP authentication by setting it in your remote server headers config or connection profile:
						</p>
						<div className="p-3 border border-border bg-background rounded-lg font-mono text-[10px] select-all text-foreground max-w-md">
							"Authorization": "Bearer your_generated_key_here"
						</div>
						<p>
							3. Save and connect the server in your desktop assistant tools panel to sync your sessions and authorize access.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
