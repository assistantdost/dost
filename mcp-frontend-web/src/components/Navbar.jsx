"use client";

import { useState } from "react";
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
import { FiMenu, FiX } from "react-icons/fi";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { user, logged, logout, initialChecked } = useAuthStore();
	const router = useRouter();

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
		<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center space-x-2">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
								D
							</div>
							<span className="text-xl font-bold text-foreground">
								DOST-MCP
							</span>
						</div>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Desktop Auth Buttons */}
					<div className="hidden md:flex items-center space-x-4 min-w-[100px] justify-end">
						{!initialChecked ? (
							<div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
						) : logged && user ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="relative h-9 w-9 rounded-full"
									>
										<Avatar className="h-9 w-9">
											<AvatarImage
												src={user.avatar}
												alt={user.name}
											/>
											<AvatarFallback>
												{user.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-56"
									align="end"
									forceMount
								>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">
												{user.name}
											</p>
											<p className="text-xs leading-none text-muted-foreground">
												{user.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => router.push("/dashboard")}
									>
										Dashboard
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => router.push("/settings")}
									>
										Settings
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={handleLogout}>
										Log out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button
								variant="default"
								onClick={() => router.push("/login")}
								className="px-6"
							>
								Sign In
							</Button>
						)}
					</div>

					{/* Mobile Menu Button */}
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild className="md:hidden">
							<Button variant="ghost" size="icon">
								{isOpen ? (
									<FiX className="h-5 w-5" />
								) : (
									<FiMenu className="h-5 w-5" />
								)}
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-[300px] sm:w-[400px]"
						>
							<SheetHeader>
								<SheetTitle>
									<div className="flex items-center gap-2">
										<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
											D
										</div>
										<span className="text-xl font-bold text-foreground">
											DOST-MCP
										</span>
									</div>
								</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col space-y-4 mt-8">
								{logged && user && (
									<div className="flex items-center space-x-3 p-4 border rounded-lg">
										<Avatar className="h-10 w-10">
											<AvatarImage
												src={user.avatar}
												alt={user.name}
											/>
											<AvatarFallback>
												{user.name
													?.charAt(0)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<p className="text-sm font-medium">
												{user.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{user.email}
											</p>
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
												onClick={() => {
													router.push("/dashboard");
													setIsOpen(false);
												}}
											>
												Dashboard
											</Button>
											<Button
												variant="outline"
												className="w-full"
												onClick={() => {
													handleLogout();
													setIsOpen(false);
												}}
											>
												Log out
											</Button>
										</>
									) : (
											<Button
												variant="outline"
												className="w-full"
												onClick={() => {
													router.push("/login");
													setIsOpen(false);
												}}
											>
												Sign In
											</Button>
									)}
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
