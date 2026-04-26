import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import StoreInitializer from "@/components/StoreInitializer";
import RefreshToken from "@/hooks/refreshToken";
import { serverApi } from "@/lib/serverApi";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata = {
	title: "DOST-MCP | Multi-Service AI Platform",
	description:
		"A distributed system implementing the Model Context Protocol to connect AI models with local and remote tools. FastAPI, LangGraph, Electron, React, Redis",
};

async function getSessionData() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	let user = null;

	if (token) {
		try {
			const userData = await serverApi("/users/me");
			user = userData.user;
		} catch (error) {
			console.error("Failed to fetch user session:", error.message);
		}
	}

	return { user, token };
}

export default async function RootLayout({ children }) {
	const { user, token } = await getSessionData();

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<StoreInitializer user={user} token={token} />
				<Navbar />
				{children}
				<Toaster position="top-center" richColors />
				<RefreshToken />
			</body>
		</html>
	);
}
