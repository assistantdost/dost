import { serverApi } from "@/lib/serverApi";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import APIKeysSection from "@/components/dashboard/APIKeysSection";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { getServerFetcher } from "@/lib/serverApi";
import { getMe } from "@/api/user";
import { getAPIKeys } from "@/api/apiKeys";

async function getDashboardData() {
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
		console.error("Dashboard data fetch failed:", error);
		return { user: null, initialApiKeys: [] };
	}
}

export default async function DashboardPage() {
	const { user, initialApiKeys } = await getDashboardData();

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>Failed to load dashboard data. Please try logging in again.</p>
			</div>
		);
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

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
							<LogoutButton />
						</CardContent>
					</Card>

					<APIKeysSection initialData={initialApiKeys} />
				</div>
			</div>
		</div>
	);
}
