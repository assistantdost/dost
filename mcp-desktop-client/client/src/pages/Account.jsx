import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Account() {
	const { user } = useAuthStore();

	return (
		<div className="container mx-auto p-6">
			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarImage src={user?.avatar} alt={user?.name} />
							<AvatarFallback>
								{user?.name
									? user.name.charAt(0).toUpperCase()
									: "U"}
							</AvatarFallback>
						</Avatar>
						Account Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium">Name</label>
						<p className="text-lg">{user?.name || "Demo User"}</p>
					</div>
					<div>
						<label className="text-sm font-medium">Email</label>
						<p className="text-lg">
							{user?.email || "demo@example.com"}
						</p>
					</div>
					<div>
						<label className="text-sm font-medium">Status</label>
						<Badge variant="secondary">Active</Badge>
					</div>
					<div>
						<label className="text-sm font-medium">
							Member Since
						</label>
						<p className="text-lg">January 2024</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
