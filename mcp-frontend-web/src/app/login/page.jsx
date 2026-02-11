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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
	const router = useRouter();
	const { login, googleLogin, loading, error } = useAuthStore();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error for this field
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) return;

		try {
			await login(formData);
			router.push("/dashboard");
		} catch (error) {
			console.error("Login error:", error);
		}
	};

	const handleGoogleSuccess = async (credentialResponse) => {
		try {
			await googleLogin(credentialResponse);
			router.push("/");
		} catch (error) {
			console.error("Google login error:", error);
		}
	};

	const handleGoogleError = () => {
		console.error("Google login failed");
	};

	return (
		<GoogleOAuthProvider
			clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
		>
			<div className="flex px-4 items-center justify-center min-h-screen">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Login to DOST MCP</CardTitle>
						<CardDescription>
							Enter your credentials to access your account.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
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
										type={
											showPassword ? "text" : "password"
										}
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
								<div className="flex justify-end mt-1">
									<Link
										href="/forgot-password"
										className="text-sm text-primary hover:underline"
									>
										Forgot password?
									</Link>
								</div>
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
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Login
							</Button>
						</form>

						<div className="relative my-4">
							<div className="absolute inset-0 flex items-center">
								<Separator />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									Or continue with
								</span>
							</div>
						</div>

						<div className="flex justify-center">
							<GoogleLogin
								onSuccess={handleGoogleSuccess}
								onError={handleGoogleError}
								theme="outline"
								size="large"
								text="signin_with"
								shape="rectangular"
								logo_alignment="left"
							/>
						</div>

						<div className="mt-4 text-center text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Link
								href="/signup"
								className="text-primary hover:underline"
							>
								Sign up
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</GoogleOAuthProvider>
	);
}
