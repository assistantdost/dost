import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import StoreInitializer from "@/components/StoreInitializer";
import RefreshToken from "@/hooks/refreshToken";
import { serverApi, getServerFetcher } from "@/lib/serverApi";
import { getMe } from "@/api/user";
import axios from "axios";

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
	const refreshToken = cookieStore.get("refresh_token")?.value;
	let user = null;
	let accessToken = null;

	if (refreshToken) {
		try {
			const fetcher = await getServerFetcher();
			const userData = await getMe(fetcher);
			user = userData.user;
			
			// We can obtain the access token by manually calling refresh once for the layout
			// to seed the client-side store, avoiding an immediate client-side refresh call
			const refreshResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {}, {
				headers: { Cookie: `refresh_token=${refreshToken}` }
			});
			accessToken = refreshResponse.data.token;
		} catch (error) {
			console.error("Failed to fetch user session in layout:", error.message);
		}
	}

	return { user, accessToken };
}

export default async function RootLayout({ children }) {
	const { user, accessToken } = await getSessionData();

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<StoreInitializer user={user} token={accessToken} />
				<Navbar />
				{children}
				<Toaster position="top-center" richColors />
				<RefreshToken />
			</body>
		</html>
	);
}
