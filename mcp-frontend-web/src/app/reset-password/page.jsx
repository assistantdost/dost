"use client";

import { useState, useRef, useEffect } from "react";
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
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
	const router = useRouter();
	const { resetPassword, resetPasswordEmail, loading } = useAuthStore();
	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [formData, setFormData] = useState({
		newPassword: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState({});
	const inputRefs = useRef([]);

	useEffect(() => {
		// Focus first input on mount
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, []);

	const handleOtpChange = (index, value) => {
		// Only allow numbers
		if (value && !/^\d+$/.test(value)) return;

		const newOtp = [...otp];
		newOtp[index] = value.slice(-1);
		setOtp(newOtp);

		if (errors.otp) {
			setErrors((prev) => ({ ...prev, otp: "" }));
		}

		// Auto-focus next input
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index, e) => {
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").slice(0, 6);

		if (!/^\d+$/.test(pastedData)) return;

		const newOtp = [...otp];
		pastedData.split("").forEach((char, index) => {
			if (index < 6) {
				newOtp[index] = char;
			}
		});
		setOtp(newOtp);

		const nextIndex = Math.min(pastedData.length, 5);
		inputRefs.current[nextIndex]?.focus();
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		const otpString = otp.join("");
		if (otpString.length !== 6) {
			newErrors.otp = "Please enter all 6 digits";
		}

		if (!formData.newPassword) {
			newErrors.newPassword = "Password is required";
		} else if (formData.newPassword.length < 8) {
			newErrors.newPassword = "Password must be at least 8 characters";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password";
		} else if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) return;

		if (!resetPasswordEmail) {
			setErrors({
				general:
					"No email found. Please request a password reset again.",
			});
			return;
		}

		try {
			await resetPassword({
				email: resetPasswordEmail,
				otp: otp.join(""),
				new_password: formData.newPassword,
			});
			router.push("/login");
		} catch (error) {
			setErrors({
				general:
					"Invalid OTP or password reset failed. Please try again.",
			});
			console.error("Reset password error:", error);
		}
	};

	if (!resetPasswordEmail) {
		return (
			<div className="flex px-4 items-center justify-center min-h-screen">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>No Reset Request Found</CardTitle>
						<CardDescription>
							Please request a password reset first
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							className="w-full"
							onClick={() => router.push("/forgot-password")}
						>
							Request Password Reset
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex px-4 items-center justify-center min-h-screen">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Reset Password</CardTitle>
					<CardDescription>
						Enter the 6-digit code sent to{" "}
						<span className="font-medium text-foreground">
							{resetPasswordEmail}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label className="mb-1">Verification Code</Label>
							<div className="flex justify-center gap-2 mt-2">
								{otp.map((digit, index) => (
									<Input
										key={index}
										ref={(el) =>
											(inputRefs.current[index] = el)
										}
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) =>
											handleOtpChange(
												index,
												e.target.value
											)
										}
										onKeyDown={(e) =>
											handleKeyDown(index, e)
										}
										onPaste={handlePaste}
										className="w-12 h-12 text-center text-lg font-semibold"
										disabled={loading}
									/>
								))}
							</div>
							{errors.otp && (
								<Alert variant="destructive" className="mt-2">
									<AlertDescription>
										{errors.otp}
									</AlertDescription>
								</Alert>
							)}
						</div>

						<div>
							<Label htmlFor="newPassword" className="mb-1">
								New Password
							</Label>
							<div className="relative">
								<Input
									id="newPassword"
									name="newPassword"
									type={showPassword ? "text" : "password"}
									placeholder="Enter new password"
									value={formData.newPassword}
									onChange={handleChange}
									disabled={loading}
									required
								/>
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showPassword ? (
										<EyeOff size={20} />
									) : (
										<Eye size={20} />
									)}
								</button>
							</div>
							{errors.newPassword && (
								<Alert variant="destructive" className="mt-2">
									<AlertDescription>
										{errors.newPassword}
									</AlertDescription>
								</Alert>
							)}
						</div>

						<div>
							<Label htmlFor="confirmPassword" className="mb-1">
								Confirm Password
							</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type={
										showConfirmPassword
											? "text"
											: "password"
									}
									placeholder="Confirm new password"
									value={formData.confirmPassword}
									onChange={handleChange}
									disabled={loading}
									required
								/>
								<button
									type="button"
									onClick={() =>
										setShowConfirmPassword(
											!showConfirmPassword
										)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showConfirmPassword ? (
										<EyeOff size={20} />
									) : (
										<Eye size={20} />
									)}
								</button>
							</div>
							{errors.confirmPassword && (
								<Alert variant="destructive" className="mt-2">
									<AlertDescription>
										{errors.confirmPassword}
									</AlertDescription>
								</Alert>
							)}
						</div>

						{errors.general && (
							<Alert variant="destructive">
								<AlertDescription>
									{errors.general}
								</AlertDescription>
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
									Resetting...
								</>
							) : (
								"Reset Password"
							)}
						</Button>
					</form>

					<div className="mt-4 text-center text-sm text-muted-foreground">
						<Link
							href="/forgot-password"
							className="text-primary hover:underline"
						>
							← Request New Code
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
