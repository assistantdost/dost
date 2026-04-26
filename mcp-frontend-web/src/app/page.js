import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
	FiServer,
	FiCloud,
	FiZap,
	FiShield,
	FiGitBranch,
	FiCpu,
} from "react-icons/fi";

export default function Home() {
	const features = [
		{
			icon: <FiServer className="h-6 w-6" />,
			title: "Local Automation",
			description:
				"Execute Windows automation scripts via stdio communication for seamless local task execution.",
		},
		{
			icon: <FiCloud className="h-6 w-6" />,
			title: "Remote APIs",
			description:
				"Integrate with Gmail, Calendar, Spotify, and Weather APIs using secure OAuth2 authentication.",
		},
		{
			icon: <FiZap className="h-6 w-6" />,
			title: "Redis Caching",
			description:
				"Fast token caching and state management across distributed service instances.",
		},
		{
			icon: <FiShield className="h-6 w-6" />,
			title: "Secure Authentication",
			description:
				"OAuth2 and JWT-based authentication for secure access to all services.",
		},
		{
			icon: <FiGitBranch className="h-6 w-6" />,
			title: "LangGraph Workflows",
			description:
				"Orchestrate multi-step tasks by chaining multiple tools together intelligently.",
		},
		{
			icon: <FiCpu className="h-6 w-6" />,
			title: "Model Context Protocol",
			description:
				"Connect AI models with local and remote tools using the MCP standard.",
		},
	];

	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-background to-muted" />
				<div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]" />
				<div className="container relative mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center space-y-8">
						<div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-4">
							<FiZap className="mr-2 h-4 w-4 text-yellow-500" />
							Multi-Service AI Platform
						</div>
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
							DOST-MCP
						</h1>
						<p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
							A distributed system implementing the Model Context
							Protocol to connect AI models with local and remote
							tools
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
							<Link href="/signup">
								<Button size="lg" className="text-lg px-8 w-full sm:w-auto">
									Get Started
								</Button>
							</Link>
							<Link href="#features">
								<Button
									size="lg"
									variant="outline"
									className="text-lg px-8 w-full sm:w-auto"
								>
									Learn More
								</Button>
							</Link>
						</div>
						<div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-green-500" />
								FastAPI Backend
							</div>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-blue-500" />
								React Frontend
							</div>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-primary" />
								Electron Desktop
							</div>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-red-500" />
								Redis Cache
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 md:py-32 bg-background">
				<div className="container mx-auto px-4">
					<div className="text-center space-y-4 mb-16">
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
							Powerful Features
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Everything you need to build intelligent,
							distributed AI applications
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
						{features.map((feature, index) => (
							<Card
								key={index}
								className="border-2 hover:border-primary transition-colors"
							>
								<CardHeader>
									<div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white mb-4">
										{feature.icon}
									</div>
									<CardTitle className="text-xl">
										{feature.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base">
										{feature.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Tech Stack Section */}
			<section className="py-20 md:py-32 bg-muted/50">
				<div className="container mx-auto px-4">
					<div className="text-center space-y-4 mb-16">
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
							Built with Modern Technology
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Leveraging industry-leading frameworks and tools
						</p>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
						{[
							{
								name: "FastAPI",
								color: "from-green-600 to-teal-600",
							},
							{
								name: "React",
								color: "from-blue-600 to-cyan-600",
							},
							{
								name: "LangGraph",
								color: "from-purple-600 to-pink-600",
							},
							{
								name: "Electron",
								color: "from-indigo-600 to-blue-600",
							},
							{
								name: "Redis",
								color: "from-red-600 to-orange-600",
							},
							{
								name: "OAuth2",
								color: "from-yellow-600 to-orange-600",
							},
							{
								name: "Next.js",
								color: "from-gray-800 to-gray-600",
							},
							{
								name: "Tailwind",
								color: "from-cyan-600 to-blue-600",
							},
						].map((tech, index) => (
							<div
								key={index}
								className="flex flex-col items-center justify-center p-6 rounded-lg bg-background border-2 hover:border-primary transition-colors"
							>
								<div
									className={`text-2xl font-bold bg-gradient-to-r ${tech.color} bg-clip-text text-transparent`}
								>
									{tech.name}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* About Section */}
			<section id="about" className="py-20 md:py-32 bg-background">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto">
						<Card className="border-2">
							<CardHeader>
								<CardTitle className="text-3xl md:text-4xl">
									About DOST-MCP
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 text-lg text-muted-foreground">
								<p>
									DOST-MCP is a distributed system
									implementing the Model Context Protocol
									(MCP) to connect AI models with both local
									and remote tools seamlessly.
								</p>
								<p>
									Built with a Python server for Windows
									automation via stdio communication, and a
									remote HTTP server integrating external APIs
									like Gmail, Calendar, Spotify, and Weather
									using OAuth2 authentication.
								</p>
								<p>
									The platform uses Redis for caching OAuth
									tokens and managing state across distributed
									instances, while an Electron + React desktop
									client visualizes tool execution flows with
									diagrammatic outputs.
								</p>
								<p>
									LangGraph workflows orchestrate multi-step
									tasks by intelligently chaining multiple
									tools together, enabling complex automation
									scenarios.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section
				id="contact"
				className="py-20 md:py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"
			>
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto text-center space-y-8 text-white">
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
							Ready to Get Started?
						</h2>
						<p className="text-xl opacity-90">
							Join the future of AI-powered automation today
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/signup">
								<Button
									size="lg"
									variant="secondary"
									className="text-lg px-8 w-full sm:w-auto"
								>
									Create Account
								</Button>
							</Link>
							<Link href="/login">
								<Button
									size="lg"
									variant="outline"
									className="text-lg px-8 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto"
								>
									Sign In
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-12 border-t bg-background">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
								D
							</div>
							<span className="text-lg font-bold">DOST-MCP</span>
						</div>
						<p className="text-sm text-muted-foreground">
							© {new Date().getFullYear()} DOST-MCP. All rights
							reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
