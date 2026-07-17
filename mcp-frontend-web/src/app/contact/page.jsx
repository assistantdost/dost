export const metadata = {
	title: "Contact Support",
	description:
		"Get in touch with support, request custom features, or connect with the DOST agentic assistant developer team.",
};

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Github, ExternalLink } from "lucide-react";

export default function ContactPage() {
	const emails = [
		"assistantant.dost@gmail.com",
		"ribhusaha2003@gmail.com",
		"sayanbarma2004@gmail.com",
		"rb636739@gmail.com",
	];

	return (
		<div className="min-h-screen bg-background text-foreground p2 md:p-6 mt-28 font-sans relative overflow-hidden">
			{/* Decorative background glows */}
			<div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-[100px]" />
			<div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />

			<div className="container mx-auto px-4 max-w-4xl space-y-8 relative z-10">
				{/* Header */}
				<div className="text-left border-b border-border/60 pb-6">
					<Badge
						variant="outline"
						className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full"
					>
						Support
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">
						Contact & Support
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Reach out to the DOST development team or contribute on
						GitHub.
					</p>
				</div>

				<div className="space-y-6">
					{/* GitHub Card */}
					<Card className="border-border bg-card shadow-sm hover:border-primary/30 transition-colors duration-300">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<Github className="h-5 w-5" />
							</div>
							<CardTitle className="text-lg">
								GitHub Repository
							</CardTitle>
							<CardDescription>
								Report issues, suggest features, or inspect the
								codebase.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<a
								href="https://github.com/assistantdost/dost"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline group"
							>
								<span>github.com/assistantdost/dost</span>
								<ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</a>
						</CardContent>
					</Card>

					{/* Email Support Card */}
					<Card className="border-border bg-card shadow-sm">
						<CardHeader>
							<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
								<Mail className="h-5 w-5" />
							</div>
							<CardTitle className="text-lg">
								Email Contacts
							</CardTitle>
							<CardDescription>
								Direct support channels for custom integrations
								and queries.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-3">
								{emails.map((email) => (
									<li
										key={email}
										className="flex items-center gap-3"
									>
										<Mail className="h-4 w-4 text-muted-foreground" />
										<a
											href={`mailto:${email}`}
											className="text-xs md:text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors"
										>
											{email}
										</a>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
