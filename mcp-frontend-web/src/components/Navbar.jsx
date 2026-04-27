"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FiMenu, FiZap } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [visible, setVisible] = useState(true);
	const [scrolled, setScrolled] = useState(false);
	const lastScrollY = useRef(0);

	const { user, logged, logout, initialChecked } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			setScrolled(currentScrollY > 20);

			if (currentScrollY < lastScrollY.current || currentScrollY < 60) {
				setVisible(true);
			} else if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
				setVisible(false);
				setIsOpen(false);
			}
			lastScrollY.current = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleLogout = async () => {
		await logout();
		router.push("/");
	};

	const navLinks = [
		{ href: "/", label: "Home" },
		{ href: "/#features", label: "Features" },
		{ href: "/#about", label: "About" },
		{ href: "/#contact", label: "Contact" },
	];

	return (
		<div
			className="fixed top-0 left-0 right-0 z-50 flex justify-center"
			style={{
				paddingTop: "16px",
				transform: visible ? "translateY(0)" : "translateY(-110%)",
				transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
			}}
		>
			<nav
				style={{
					background: scrolled
						? "rgba(13, 12, 34, 0.85)"
						: "rgba(13, 12, 34, 0.6)",
					backdropFilter: "blur(20px)",
					WebkitBackdropFilter: "blur(20px)",
					border: "1px solid rgba(0, 210, 255, 0.15)",
					borderRadius: "9999px",
					padding: "8px 24px",
					boxShadow: scrolled
						? "0 8px 32px rgba(0, 210, 255, 0.08), 0 0 0 1px rgba(0,210,255,0.06)"
						: "none",
					transition: "all 0.3s ease",
					width: "min(900px, calc(100vw - 32px))",
				}}
			>
				<div className="flex h-12 items-center justify-between gap-6">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2 shrink-0">
						<div
							style={{
								width: "32px",
								height: "32px",
								borderRadius: "10px",
								background: "#00D2FF",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								boxShadow: "0 0 12px rgba(0,210,255,0.4)",
							}}
						>
							<FiZap className="text-[#0D0C22]" size={16} />
						</div>
						<span className="text-lg font-semibold text-foreground tracking-tight">
							DOST
						</span>
					</Link>

					{/* Desktop Links */}
					<div className="hidden md:flex items-center gap-6 flex-1 justify-center">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Desktop Auth */}
					<div className="hidden md:flex items-center gap-3 shrink-0 min-w-[100px] justify-end">
						{!initialChecked ? (
							<div className="h-8 w-20 bg-muted animate-pulse rounded-full" />
						) : logged && user ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
										<Avatar className="h-8 w-8">
											<AvatarImage src={user.avatar} alt={user.name} />
											<AvatarFallback
												style={{ background: "#1A1930", color: "#00D2FF", fontSize: "13px", fontWeight: 600 }}
											>
												{user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-52" align="end" forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col gap-0.5">
											<p className="text-sm font-medium">{user.name}</p>
											<p className="text-xs text-muted-foreground">{user.email}</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => router.push("/dashboard")}>
										Dashboard
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => router.push("/profile")}>
										Profile
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout}>
										Log out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button
								size="sm"
								onClick={() => router.push("/login")}
								style={{
									background: "#00D2FF",
									color: "#0D0C22",
									borderRadius: "9999px",
									fontWeight: 600,
									fontSize: "13px",
									padding: "6px 18px",
									boxShadow: "0 0 12px rgba(0,210,255,0.25)",
									transition: "all 0.1s ease",
								}}
								className="hover:opacity-90 active:scale-95"
							>
								Sign In
							</Button>
						)}
					</div>

					{/* Mobile Menu - Sheet */}
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild className="md:hidden">
							<Button variant="ghost" size="icon">
								<FiMenu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[300px] sm:w-[400px]">
							<SheetHeader>
								<SheetTitle>
									<div className="flex items-center gap-2">
										<div
											style={{
												width: "32px",
												height: "32px",
												borderRadius: "10px",
												background: "#00D2FF",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												boxShadow: "0 0 12px rgba(0,210,255,0.4)",
											}}
										>
											<FiZap className="text-[#0D0C22]" size={16} />
										</div>
										<span className="text-xl font-bold text-foreground">DOST</span>
									</div>
								</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col space-y-4 mt-8">
								{logged && user && (
									<div className="flex items-center space-x-3 p-4 border rounded-lg">
										<Avatar className="h-10 w-10">
											<AvatarImage src={user.avatar} alt={user.name} />
											<AvatarFallback
												style={{ background: "#1A1930", color: "#00D2FF", fontSize: "13px", fontWeight: 600 }}
											>
												{user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<p className="text-sm font-medium">{user.name}</p>
											<p className="text-xs text-muted-foreground">{user.email}</p>
										</div>
									</div>
								)}
								{navLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="text-lg font-medium hover:text-primary transition-colors"
										onClick={() => setIsOpen(false)}
									>
										{link.label}
									</Link>
								))}
								<div className="pt-4 border-t space-y-2">
									{logged && user ? (
										<>
											<Button
												variant="outline"
												className="w-full"
												onClick={() => { router.push("/dashboard"); setIsOpen(false); }}
											>
												Dashboard
											</Button>
											<Button
												variant="outline"
												className="w-full"
												onClick={() => { handleLogout(); setIsOpen(false); }}
											>
												Log out
											</Button>
										</>
									) : (
										<Button
											className="w-full"
											style={{ background: "#00D2FF", color: "#0D0C22", fontWeight: 600 }}
											onClick={() => { router.push("/login"); setIsOpen(false); }}
										>
											Sign In
										</Button>
									)}
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</div>
	);
};

export default Navbar;
