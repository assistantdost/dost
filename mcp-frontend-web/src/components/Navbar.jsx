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
import { Menu, Zap, User, LogOut, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="h-8 w-8 rounded-full bg-muted/40 animate-pulse shrink-0" />
		);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-8 w-8 rounded-full shrink-0"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
			) : (
				<Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
			)}
		</Button>
	);
};

const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [visible, setVisible] = useState(true);
	const [scrolled, setScrolled] = useState(false);
	const lastScrollY = useRef(0);

	const { user, logged, logout, initialChecked } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();
	const isProd = process.env.NEXT_PUBLIC_MODE === "prod";

	useEffect(() => {
		setVisible(true);
	}, [pathname]);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			setScrolled(currentScrollY > 20);

			const isDocsOrTechnical =
				pathname?.startsWith("/docs") ||
				pathname?.startsWith("/technical");

			if (
				isDocsOrTechnical ||
				currentScrollY < lastScrollY.current ||
				currentScrollY < 60
			) {
				setVisible(true);
			} else if (
				currentScrollY > lastScrollY.current &&
				currentScrollY > 60
			) {
				setVisible(false);
				setIsOpen(false);
			}
			lastScrollY.current = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [pathname]);

	const handleLogout = async () => {
		await logout();
		router.push("/");
	};

	const navLinks = [
		{ href: "/", label: "Home" },
		{ href: "/docs", label: "Docs" },
		{ href: "/mcp-servers", label: "MCP Servers" },
		{ href: "/technical", label: "Technical" },
		{ href: "/changelog", label: "Changelog" },
		{ href: "/about", label: "About" },
		{ href: "/contact", label: "Contact" },
	];

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 w-full transition-transform duration-300 ${
				visible ? "translate-y-0" : "-translate-y-full"
			}`}
		>
			<nav
				className={`flex h-16 w-full items-center justify-between gap-6 border-b px-6 md:px-12 transition-all duration-300 ${
					scrolled
						? "bg-background/90 border-border backdrop-blur-md shadow-sm"
						: "bg-background/50 border-border/40 backdrop-blur-sm"
				}`}
			>
				{/* Logo */}
				<Link
					href="/"
					className="flex items-center gap-2 shrink-0 group"
				>
					<div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden transition-transform group-hover:scale-105">
						<img
							src="/dost.png"
							alt="DOST Logo"
							className="h-full w-full object-cover"
						/>
					</div>
					<span className="text-lg font-semibold tracking-tight text-foreground">
						DOST
					</span>
				</Link>

				{/* Desktop Links */}
				<div className="hidden md:flex items-center gap-6">
					{navLinks.map((link) => {
						const isActive =
							pathname === link.href ||
							(link.href !== "/" &&
								pathname?.startsWith(link.href));
						return (
							<Link
								key={link.href}
								href={link.href}
								className={`text-sm font-semibold transition-colors duration-150 ${
									isActive
										? "text-primary font-bold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{link.label}
							</Link>
						);
					})}
				</div>

				{/* Desktop Auth */}
				<div className="hidden md:flex items-center gap-3 shrink-0">
					<ThemeToggle />
					{!isProd && (
						<>
							{!initialChecked ? (
								<div className="h-7 w-16 bg-muted animate-pulse rounded-full" />
							) : logged && user ? (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="relative h-8 w-8 rounded-full p-0"
										>
											<Avatar className="h-7 w-7">
												<AvatarImage
													src={user.avatar}
													alt={user.name}
												/>
												<AvatarFallback className="bg-muted text-primary text-sm font-bold">
													{user.name
														?.charAt(0)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										className="w-52"
										align="end"
										forceMount
									>
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col gap-0.5">
												<p className="text-sm font-medium">
													{user.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{user.email}
												</p>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuItem
											onClick={() =>
												router.push("/profile")
											}
										>
											<User className="mr-2 h-4 w-4" />
											Profile
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={handleLogout}
										>
											<LogOut className="mr-2 h-4 w-4" />
											Log out
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<Button
									size="sm"
									onClick={() => router.push("/login")}
									className="h-8 rounded-full px-5 text-xs font-semibold"
								>
									Sign In
								</Button>
							)}
						</>
					)}
				</div>

				{/* Mobile Menu - Sheet */}
				<div className="flex md:hidden items-center gap-2">
					<ThemeToggle />
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
							>
								<Menu className="h-4 w-4" />
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-[300px] border-l border-border bg-background"
						>
							<SheetHeader>
								<SheetTitle>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
												<img
													src="/dost.png"
													alt="DOST Logo"
													className="h-full w-full object-cover"
												/>
											</div>
											<span className="text-lg font-semibold text-foreground">
												DOST
											</span>
										</div>
									</div>
								</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col h-[calc(100vh-100px)] justify-between pt-6">
								<div className="flex flex-col space-y-6">
									{/* Profile section if logged in */}
									{!isProd &&
										(logged && user ? (
											<div className="flex items-center space-x-3 p-4 border border-border rounded-xl bg-muted/40 shadow-inner">
												<Avatar className="h-10 w-10">
													<AvatarImage
														src={user.avatar}
														alt={user.name}
													/>
													<AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
														{user.name
															?.charAt(0)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="flex flex-col min-w-0">
													<p className="text-xs font-bold text-foreground truncate">
														{user.name}
													</p>
													<p className="text-[10px] text-muted-foreground truncate">
														{user.email}
													</p>
												</div>
											</div>
										) : (
											<div className="p-4 border border-border/60 border-dashed rounded-xl bg-card/50 text-left">
												<p className="text-xs font-bold text-foreground">
													Welcome to DOST
												</p>
												<p className="text-[10px] text-muted-foreground mt-1">
													Sign in to sync your local
													environment and connect
													cloud services.
												</p>
											</div>
										))}

									{/* Navigation list */}
									<div className="flex flex-col space-y-1">
										{navLinks.map((link) => {
											const isActive =
												pathname === link.href ||
												(link.href !== "/" &&
													pathname?.startsWith(
														link.href,
													));
											return (
												<Link
													key={link.href}
													href={link.href}
													className={`flex items-center justify-between text-sm font-semibold px-3 py-2.5 rounded-lg transition-all ${
														isActive
															? "text-primary bg-primary/10"
															: "hover:text-primary hover:bg-muted/30"
													}`}
													onClick={() =>
														setIsOpen(false)
													}
												>
													<span>{link.label}</span>
													<span className="text-muted-foreground/30 text-xs">
														&rarr;
													</span>
												</Link>
											);
										})}
									</div>
								</div>

								{/* Action Buttons & Footer */}
								<div className="space-y-4 pt-4 border-t border-border">
									{!isProd && (
										<>
											{logged && user ? (
												<div className="flex flex-col gap-2">
													<Button
														variant="outline"
														size="sm"
														className="w-full h-10 rounded-xl text-xs font-semibold"
														onClick={() => {
															router.push(
																"/profile",
															);
															setIsOpen(false);
														}}
													>
														<User className="mr-2 h-4 w-4" />
														Go to Profile
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="w-full h-10 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10"
														onClick={() => {
															handleLogout();
															setIsOpen(false);
														}}
													>
														<LogOut className="mr-2 h-4 w-4" />
														Log out
													</Button>
												</div>
											) : (
												<Button
													size="sm"
													className="w-full h-10 rounded-xl text-xs font-semibold"
													onClick={() => {
														router.push("/login");
														setIsOpen(false);
													}}
												>
													Sign In to Account
												</Button>
											)}
										</>
									)}

									<div className="text-center pt-2">
										<p className="text-[10px] text-muted-foreground">
											DOST Platform &bull; v0.1.0
										</p>
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</header>
	);
};

export default Navbar;
