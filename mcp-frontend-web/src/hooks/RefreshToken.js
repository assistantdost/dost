"use client";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";

function RefreshToken() {
	const refreshToken = useAuthStore((state) => state.refreshToken);
	useEffect(() => {
		const interval = setInterval(
			() => {
				refreshToken();
			},
			15 * 60 * 1000,
		);
		refreshToken(); // Refresh immediately on mount
		return () => clearInterval(interval);
	}, [refreshToken]);
	return null; // This component doesn't render anything
}

export default RefreshToken;
