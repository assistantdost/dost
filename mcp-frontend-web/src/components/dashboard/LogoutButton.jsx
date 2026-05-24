"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
	const { logout } = useAuthStore();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.push("/login");
	};

	return (
		<Button
			variant="outline"
			className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-border rounded-lg h-9 px-4 text-xs font-semibold"
			onClick={handleLogout}
		>
			Logout
		</Button>
	);
}
