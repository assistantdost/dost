"use client";

import { useAuthStore } from "@/store/authStore";
import { useEffect, useRef } from "react";

export default function StoreInitializer({ user, token }) {
	const initialized = useRef(false);

	if (!initialized.current) {
		if (user) {
			useAuthStore.setState({ user, logged: true });
		}
		if (token) {
			useAuthStore.setState({ token });
		}
		initialized.current = true;
	}

	return null;
}
