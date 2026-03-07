import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";

import RefreshToken from "@/hooks/refreshToken";

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

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Navbar />
				{children}
				<Toaster position="top-center" richColors />
				<RefreshToken />
			</body>
		</html>
	);
}
