"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const { forgotPassword, loading } = useAuthStore();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");

	const validateEmail = () => {
		if (!email) {
			setError("Email is required");
			return false;
		}
		if (!/\S+@\S+\.\S+/.test(email)) {
			setError("Email is invalid");
			return false;
		}
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!validateEmail()) return;

		try {
			await forgotPassword(email);
			router.push("/reset-password");
		} catch (error) {
			console.error("Forgot password error:", error);
		}
	};

	return (
		<div className="flex px-4 items-center justify-center min-h-screen">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Forgot Password?</CardTitle>
					<CardDescription>
						Enter your email and we&apos;ll send you a code to reset
						your password
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="email" className="mb-1">
								Email Address
							</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									setError("");
								}}
								disabled={loading}
								required
							/>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button
							type="submit"
							className="w-full"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending...
								</>
							) : (
								"Send Reset Code"
							)}
						</Button>
					</form>

					<div className="mt-4 text-center text-sm text-muted-foreground">
						<Link
							href="/login"
							className="text-primary hover:underline"
						>
							← Back to Sign In
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
