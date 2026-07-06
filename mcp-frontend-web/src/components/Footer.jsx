import Link from "next/link";
import { Zap } from "lucide-react";

const GITHUB_URL = "https://github.com/assistantdost/dost";

export default function Footer() {
	return (
		<footer className="border-t border-border bg-card/40 py-16 px-6 md:px-12">
			<div className="container mx-auto max-w-6xl">
				{/* Top Part: Statement & Columns */}
				<div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border">
					{/* Statement */}
					<div className="md:col-span-5 space-y-4 text-left">
						<h3 className="text-2xl md:text-3xl font-extrabold tracking-tight max-w-[18ch] leading-tight">
							One Assistant.
							<br />
							Unlimited Actions.
						</h3>
						<p className="text-xs text-muted-foreground max-w-md leading-relaxed">
							DOST is an open-source personal agentic AI assistant
							framework implementing the standardized Model
							Context Protocol (MCP). Connect models to tools
							locally and safely.
						</p>
					</div>

					{/* Links Columns */}
					<div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left">
						<div className="space-y-3">
							<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Product
							</h4>
							<ul className="space-y-2 text-xs">
								<li>
									<Link
										href="/about"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										About Us
									</Link>
								</li>
								<li>
									<Link
										href="/changelog"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Changelog
									</Link>
								</li>
								<li>
									<Link
										href="/contact"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Contact Support
									</Link>
								</li>
								<li>
									<Link
										href="/mcp-servers"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										MCP Servers Explorer
									</Link>
								</li>
							</ul>
						</div>
						<div className="space-y-3">
							<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Documentation
							</h4>
							<ul className="space-y-2 text-xs">
								<li>
									<Link
										href="/docs"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										User Guides
									</Link>
								</li>
								<li>
									<Link
										href="/technical"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Technical Specs
									</Link>
								</li>
							</ul>
						</div>
						<div className="space-y-3 col-span-2 sm:col-span-1">
							<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Ecosystem
							</h4>
							<ul className="space-y-2 text-xs">
								<li>
									<a
										href={GITHUB_URL}
										target="_blank"
										rel="noopener noreferrer"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										GitHub Repository
									</a>
								</li>
								<li>
									<a
										href="https://modelcontextprotocol.io"
										target="_blank"
										rel="noopener noreferrer"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										MCP Standard
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Part: Meta info */}
				<div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden shadow-sm">
							<img
								src="/dost.png"
								alt="DOST Logo"
								className="h-full w-full object-cover"
							/>
						</div>
						<span className="text-lg font-bold tracking-tight">
							DOST
						</span>
					</div>

					<div className="flex items-center gap-6 text-[10px] text-muted-foreground">
						<span>
							&copy; {new Date().getFullYear()} DOST. MIT
							Licensed.
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
							All systems operational (Windows Only)
						</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
