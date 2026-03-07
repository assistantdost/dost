"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

/**
 * Renders the official Google Identity Services button.
 * Produces the same credentialResponse (with `.credential` ID token)
 * as @react-oauth/google — no wrapper library needed.
 */
export default function GoogleSignInButton({
	onSuccess,
	onError,
	text = "signin_with", // "signin_with" | "signup_with" | "continue_with"
}) {
	const buttonRef = useRef(null);

	const initGSI = () => {
		if (!window.google || !buttonRef.current) return;

		window.google.accounts.id.initialize({
			client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
			callback: (response) => {
				if (response?.credential) {
					onSuccess(response);
				} else {
					onError?.();
				}
			},
		});

		window.google.accounts.id.renderButton(buttonRef.current, {
			theme: "outline",
			size: "large",
			text,
			shape: "rectangular",
			logo_alignment: "left",
			width: 300,
		});
	};

	// If the script was already loaded (e.g. navigating back), initialize immediately
	useEffect(() => {
		if (window.google) initGSI();
	}, []);

	return (
		<>
			<Script
				src="https://accounts.google.com/gsi/client"
				strategy="afterInteractive"
				onLoad={initGSI}
			/>
			<div ref={buttonRef} />
		</>
	);
}
