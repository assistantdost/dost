import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);
	const { login, googleLogin, loading, error } = useAuthStore();
	const navigate = useNavigate();

	const hasLoggedInRef = useRef(false); // New ref to prevent duplicate logins

	const VITE_WEB_URL = import.meta.env.VITE_WEB_URL;

	useEffect(() => {
		const handleTokens = async (event, tokens) => {
			if (hasLoggedInRef.current) return; // Prevent multiple executions
			try {
				hasLoggedInRef.current = true; // Mark as processed
				await googleLogin(tokens);
				navigate("/");
			} catch (err) {
				toast("Failed to store tokens");
				hasLoggedInRef.current = false; // Reset on error to allow retry
			}
		};
		window.oauthAPI.onTokens(handleTokens);
		return () => window.oauthAPI.offTokens(handleTokens);
	}, [navigate]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await login(formData);
			navigate("/");
		} catch (err) {
			// Error handled in store
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			await window.googleAPI.signin();
		} catch (err) {
			toast("Google Sign-In failed");
		}
	};

	return (
		<div className="flex px-4 items-center justify-center min-h-[90vh] ">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Login to DOST MCP</CardTitle>
					<CardDescription>
						Enter your credentials to access your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="email" className="mb-1">
								Email
							</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="Enter your email"
								value={formData.email}
								onChange={handleChange}
								required
							/>
						</div>
						<div>
							<Label htmlFor="password" className="mb-1">
								Password
							</Label>
							<div className="relative">
								<Input
									id="password"
									name="password"
									placeholder="Enter your password"
									type={showPassword ? "text" : "password"}
									value={formData.password}
									onChange={handleChange}
									required
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									aria-label={
										showPassword
											? "Hide password"
											: "Show password"
									}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Button
							type="submit"
							className="w-full "
							disabled={loading}
						>
							{loading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Login
						</Button>

						<div className="mx-auto">
							<Button
								onClick={handleGoogleSignIn}
								variant="outline"
								className="w-full"
							>
								Sign in with Google
							</Button>
						</div>
					</form>
					<div className="mt-4 text-center">
						<p className="text-sm text-gray-600">
							Don't have an account?{" "}
							<a
								href={`${VITE_WEB_URL}/signup`}
								target="_blank"
								className="text-blue-600 hover:underline"
							>
								Sign up
							</a>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
