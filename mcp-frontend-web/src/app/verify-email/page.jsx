"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/authStore";
import { Loader2, CheckCircle } from "lucide-react";

export default function VerifyEmailPage() {
	const router = useRouter();
	const { verifyOTP, resendOTP, signupData, loading } = useAuthStore();
	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [error, setError] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const inputRefs = useRef([]);

	useEffect(() => {
		// Focus first input on mount
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, []);

	const handleChange = (index, value) => {
		// Only allow numbers
		if (value && !/^\d+$/.test(value)) return;

		const newOtp = [...otp];
		newOtp[index] = value.slice(-1); // Only take last character
		setOtp(newOtp);
		setError("");

		// Auto-focus next input
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index, e) => {
		// Handle backspace
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

		// Focus last filled input or next empty
		const nextIndex = Math.min(pastedData.length, 5);
		inputRefs.current[nextIndex]?.focus();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const otpString = otp.join("");

		if (otpString.length !== 6) {
			setError("Please enter all 6 digits");
			return;
		}

		try {
			await verifyOTP({
				email: signupData.email,
				otp: otpString,
			});
			router.push("/login");
		} catch (error) {
			setError("Invalid OTP. Please try again.");
			console.error("OTP verification error:", error);
		}
	};

	const handleResendOTP = async () => {
		if (!signupData?.email) {
			setError("No email found. Please sign up again.");
			return;
		}

		setResendLoading(true);
		setResendSuccess(false);

		try {
			await resendOTP(signupData.email);
			setResendSuccess(true);
			setOtp(["", "", "", "", "", ""]);
			inputRefs.current[0]?.focus();
		} catch (error) {
			setError("Failed to resend OTP. Please try again.");
			console.error("Resend OTP error:", error);
		} finally {
			setResendLoading(false);
		}
	};

	if (!signupData?.email) {
		return (
			<div className="flex px-4 items-center justify-center min-h-screen">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>No Email Found</CardTitle>
						<CardDescription>
							Please sign up first to verify your email
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							className="w-full"
							onClick={() => router.push("/signup")}
						>
							Go to Sign Up
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
					<CardTitle>Verify Your Email</CardTitle>
					<CardDescription>
						We sent a 6-digit code to{" "}
						<span className="font-medium text-foreground">
							{signupData.email}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="flex justify-center gap-2">
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
										handleChange(index, e.target.value)
									}
									onKeyDown={(e) => handleKeyDown(index, e)}
									onPaste={handlePaste}
									className="w-12 h-12 text-center text-lg font-semibold"
									disabled={loading}
								/>
							))}
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{resendSuccess && (
							<Alert>
								<AlertDescription className="text-green-600">
									OTP resent successfully!
								</AlertDescription>
							</Alert>
						)}

						<Button
							type="submit"
							className="w-full"
							disabled={loading || otp.join("").length !== 6}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify Email"
							)}
						</Button>
					</form>

					<div className="text-center text-sm">
						<p className="text-muted-foreground mb-2">
							Didn&apos;t receive the code?
						</p>
						<Button
							variant="link"
							onClick={handleResendOTP}
							disabled={resendLoading}
							className="p-0 h-auto font-medium"
						>
							{resendLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Resending...
								</>
							) : (
								"Resend OTP"
							)}
						</Button>
					</div>

					<div className="text-center text-sm text-muted-foreground">
						<Link
							href="/signup"
							className="text-primary hover:underline"
						>
							← Back to Sign Up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
