"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
	const { logout } = useAuthStore();
	const router = useRouter();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	return (
		<Button
			variant="outline"
			className="w-full mt-4 text-red-500 hover:text-red-600"
			onClick={handleLogout}
		>
			Logout
		</Button>
	);
}
