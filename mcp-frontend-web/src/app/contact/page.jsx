"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";

export default function ContactPage() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "Feedback",
		message: ""
	});
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!formData.name || !formData.email || !formData.message) {
			setError("Please fill out all required fields.");
			return;
		}

		setError("");
		setSubmitting(true);

		// Simulate API call
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			setFormData({ name: "", email: "", subject: "Feedback", message: "" });
		}, 1000);
	};

	return (
		<div className="min-h-screen bg-background text-foreground p-6 pt-28 font-sans">
			<div className="container mx-auto max-w-4xl space-y-8">
				{/* Header */}
				<div className="text-center md:text-left border-b border-border/60 pb-6">
					<Badge variant="outline" className="mb-3 bg-primary/10 border-primary text-primary text-xs font-semibold px-3 py-0.5 rounded-full">
						Support
					</Badge>
					<h1 className="text-3xl font-bold tracking-tight">Contact & Feedback</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Submit feedback, report system bugs, or reach out with custom server integration proposals.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
					{/* Left Column: Details */}
					<div className="md:col-span-5 space-y-6">
						<Card className="border-border bg-card shadow-sm">
							<CardHeader>
								<div className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center mb-2">
									<Mail className="h-5 w-5" />
								</div>
								<CardTitle className="text-base">Support Channels</CardTitle>
								<CardDescription>Direct support contact methods.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-xs md:text-sm text-muted-foreground">
								<p>
									Since DOST is completely open-source, we encourage tracking bugs and proposing feature enhancements via our GitHub repository issues panel.
								</p>
								<div className="space-y-2 pt-2">
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-primary shrink-0" />
										<span className="font-semibold text-foreground">support@dost-mcp.org</span>
									</div>
									<div className="flex items-center gap-2">
										<MessageSquare className="h-4 w-4 text-primary shrink-0" />
										<span className="font-semibold text-foreground">github.com/dost-mcp/dost/issues</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column: Contact Form */}
					<div className="md:col-span-7">
						<Card className="border-border bg-card shadow-sm">
							<CardHeader>
								<CardTitle className="text-base font-bold">Feedback Form</CardTitle>
								<CardDescription>We typically reply within 24–48 business hours.</CardDescription>
							</CardHeader>
							<CardContent>
								{submitted ? (
									<div className="p-6 border border-emerald-500/30 bg-emerald-500/5 rounded-lg text-center space-y-3">
										<CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
										<h4 className="text-sm font-bold text-foreground">Thank you for your feedback!</h4>
										<p className="text-xs text-muted-foreground">
											Your message was successfully received. Our core developers will inspect the report shortly.
										</p>
										<Button size="sm" onClick={() => setSubmitted(false)} className="rounded-lg h-9">
											Send another message
										</Button>
									</div>
								) : (
									<form onSubmit={handleSubmit} className="space-y-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-1.5">
												<Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
													Name <span className="text-primary">*</span>
												</Label>
												<Input
													id="name"
													name="name"
													placeholder="Your name"
													value={formData.name}
													onChange={handleChange}
													required
													className="rounded-lg"
												/>
											</div>
											<div className="space-y-1.5">
												<Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
													Email Address <span className="text-primary">*</span>
												</Label>
												<Input
													id="email"
													name="email"
													type="email"
													placeholder="name@company.com"
													value={formData.email}
													onChange={handleChange}
													required
													className="rounded-lg"
												/>
											</div>
										</div>

										<div className="space-y-1.5">
											<Label htmlFor="subject" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
												Subject
											</Label>
											<Input
												id="subject"
												name="subject"
												placeholder="Feedback topic"
												value={formData.subject}
												onChange={handleChange}
												className="rounded-lg"
											/>
										</div>

										<div className="space-y-1.5">
											<Label htmlFor="message" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
												Message <span className="text-primary">*</span>
											</Label>
											<textarea
												id="message"
												name="message"
												rows={4}
												placeholder="Describe your suggestion, bug report, or integration request..."
												value={formData.message}
												onChange={handleChange}
												required
												className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground resize-none"
											/>
										</div>

										{error && (
											<Alert variant="destructive" className="rounded-lg py-2">
												<AlertDescription className="text-xs">{error}</AlertDescription>
											</Alert>
										)}

										<Button
											type="submit"
											disabled={submitting}
											className="w-full rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2"
										>
											{submitting ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													Submitting...
												</>
											) : (
												<>
													<Send className="h-3.5 w-3.5" />
													Submit Feedback
												</>
											)}
										</Button>
									</form>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
