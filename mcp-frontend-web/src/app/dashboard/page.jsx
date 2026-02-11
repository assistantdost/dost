"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
	const router = useRouter();
	const { user, logged, logout } = useAuthStore();

	useEffect(() => {
		if (!logged) {
			router.push("/login");
		}
	}, [logged, router]);

	if (!logged || !user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 p-4 pt-20">
			<div className="container mx-auto max-w-6xl space-y-8">
				<div className="text-center space-y-2">
					<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
						Welcome to DOST-MCP
					</h1>
					<p className="text-xl text-muted-foreground">
						Hello, {user.name}!
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
							<CardDescription>
								Your account information
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div>
								<p className="text-sm text-muted-foreground">
									Name
								</p>
								<p className="font-medium">{user.name}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									Email
								</p>
								<p className="font-medium">{user.email}</p>
							</div>
							{user.role && (
								<div>
									<p className="text-sm text-muted-foreground">
										Role
									</p>
									<p className="font-medium capitalize">
										{user.role}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
							<CardDescription>
								Manage your account
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button
								variant="outline"
								className="w-full justify-start"
							>
								View Services
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start"
							>
								Settings
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start text-red-500 hover:text-red-600"
								onClick={() => {
									logout();
									router.push("/");
								}}
							>
								Logout
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Getting Started</CardTitle>
							<CardDescription>
								Explore DOST-MCP features
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Welcome to the Multi-Service AI Platform. Start
								exploring our features and integrations.
							</p>
							<Button className="w-full">
								View Documentation
							</Button>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Available Services</CardTitle>
						<CardDescription>
							Integrated APIs and Tools
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[
								{ name: "Gmail", status: "Available" },
								{ name: "Calendar", status: "Available" },
								{ name: "Spotify", status: "Available" },
								{ name: "Weather", status: "Available" },
								{
									name: "Local Automation",
									status: "Available",
								},
								{ name: "LangGraph", status: "Available" },
								{ name: "Redis Cache", status: "Active" },
								{ name: "OAuth2", status: "Active" },
							].map((service, index) => (
								<div
									key={index}
									className="p-4 border rounded-lg text-center hover:border-primary transition-colors"
								>
									<p className="font-medium">
										{service.name}
									</p>
									<p className="text-xs text-green-500">
										{service.status}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
