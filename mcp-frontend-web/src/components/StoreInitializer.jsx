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
		useAuthStore.setState({ initialChecked: true });
		initialized.current = true;
	}

	return null;
}
