import React from "react";
import { User, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/store/authStore";

export function SidebarFooterActions() {
	const { logged, user, logout } = useAuthStore();

	if (!logged) {
		return (
			<div className="text-center">
				<p className="text-xs text-muted-foreground mb-2">
					Sign in to your account
				</p>
				<Button asChild size="sm">
					<Link to="/login">Login</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<Avatar className="h-8 w-8">
					<AvatarImage src={user?.avatar} alt={user?.name} />
					<AvatarFallback>
						{user?.name ? user.name.charAt(0).toUpperCase() : "U"}
					</AvatarFallback>
				</Avatar>
				<span className="text-sm font-medium">
					{user?.name || "User"}
				</span>
			</div>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 cursor-pointer"
					>
						<User className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="max-w-48 p-1" align="end">
					<div className="space-y-1">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							asChild
						>
							<Link to="/account">
								<User className="mr-2 h-4 w-4" />
								Account
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							asChild
						>
							<Link to="/settings">
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start text-destructive hover:text-destructive"
							onClick={logout}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
