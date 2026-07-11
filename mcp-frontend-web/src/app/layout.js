import { Oxanium, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import RefreshToken from "@/hooks/RefreshToken";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const oxanium = Oxanium({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

export const metadata = {
	metadataBase: new URL("https://dost-assistant.vercel.app"),
	title: {
		default: "DOST - Personal Agentic AI Assistant",
		template: "%s | DOST",
	},
	description:
		"DOST is an open-source personal agentic AI assistant framework implementing the standardized Model Context Protocol (MCP) to automate Windows desktop actions and cloud services safely.",
	keywords: [
		"DOST",
		"Agentic AI",
		"AI Assistant",
		"Model Context Protocol",
		"MCP",
		"Windows Automation",
		"Desktop Assistant",
		"Personal AI",
		"Open Source AI",
		"LangGraph",
		"FastAPI",
		"Electron AI",
		"Context Engineering",
	],
	authors: [
		{ name: "Dost Team", url: "https://github.com/assistantdost/dost" },
	],
	creator: "Dost Team",
	publisher: "Dost Team",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: "/dost.ico",
		shortcut: "/dost.ico",
		apple: "/dost.png",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://github.com/assistantdost/dost",
		title: "DOST - Personal Agentic AI Assistant",
		description:
			"Most AI assistants are built for conversation. DOST is built for execution. Ask naturally, and DOST takes action across your Windows desktop and cloud tools.",
		siteName: "DOST",
		images: [
			{
				url: "/twitter%20card%20large.png",
				width: 1200,
				height: 628,
				alt: "DOST - Personal Agentic AI Assistant",
			},
			{
				url: "/twitter%20card%20app.png",
				width: 800,
				height: 800,
				alt: "DOST - Personal Agentic AI Assistant Icon",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "DOST - Personal Agentic AI Assistant",
		description:
			"An AI-powered desktop assistant that can control your PC, manage your emails, play music, and fetch live market data - all through natural language using MCP.",
		images: [
			{
				url: "/twitter%20card%20large.png",
				width: 1200,
				height: 628,
				alt: "DOST - Personal Agentic AI Assistant",
			},
		],
		creator: "@TheFastest599",
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${oxanium.variable} ${poppins.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<TooltipProvider>
						<Navbar />
						{children}
						<Toaster position="top-center" richColors />
						<RefreshToken />
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
