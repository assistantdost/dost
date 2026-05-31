import { Oxanium, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import RefreshToken from "@/hooks/refreshToken";
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
	title: "DOST-MCP | Multi-Service AI Platform",
	description:
		"A distributed system implementing the Model Context Protocol to connect AI models with local and remote tools. FastAPI, LangGraph, Electron, React, Redis",
	icons: {
		icon: "/dost.ico",
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
