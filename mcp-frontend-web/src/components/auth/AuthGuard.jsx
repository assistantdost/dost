"use client";

import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
	const { logged, initialChecked } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		// If we've finished the initial check and the user is still not logged in, redirect to login.
		if (initialChecked && !logged) {
			router.push("/login");
		}
	}, [logged, initialChecked, router]);

	// While we are performing the initial check (SSR hydration or refresh),
	// show a loader to avoid unauthenticated flash.
	if (!initialChecked) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-muted-foreground animate-pulse">
					Securing your session...
				</p>
			</div>
		);
	}

	return <>{children}</>;
}
