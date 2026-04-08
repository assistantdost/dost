import {
	Calendar,
	Home,
	User,
	Inbox,
	Search,
	Settings,
	MessageCircle,
	TestTubeDiagonal,
	MoreHorizontal,
	LogOut,
	Sun,
	Moon,
	MessageSquarePlus,
	ToolCase,
} from "lucide-react";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupAction,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
	SidebarHeader,
	SidebarFooter,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import useGlobalStore from "@/store/globalStore";
import { useMcpStore } from "@/store/mcpStore";
import { chatQueryOptions } from "@/lib/tanstackQueries";

import { ChatItemActions } from "@/components/sidebar/ChatItemActions";
import { SidebarFooterActions } from "@/components/sidebar/SidebarFooterActions";

// Menu items.
const items = [
	{
		title: "Home",
		url: "/",
		icon: Home,
	},
	{
		title: "Test",
		url: "/test",
		icon: TestTubeDiagonal,
	},
	{
		title: "Test Chat",
		url: "/chat",
		icon: MessageSquarePlus,
	},
];

export function AppSidebar() {
	const token = useAuthStore((state) => state.token);
	const { activeChatId } = useChatStore();
	const { theme, toggleTheme, logged } = useGlobalStore();
	const { toolCount } = useMcpStore();

	// Fetch user chats with TanStack Infinite Query - only when logged and has token
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(
			chatQueryOptions.list({
				enabled: logged && !!token,
			}),
		);

	const allChats = data?.pages?.flatMap((page) => page.chats) || [];

	const sentinelRef = useRef(null);

	useEffect(() => {
		if (sentinelRef.current && hasNextPage) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && !isFetchingNextPage) {
						fetchNextPage();
					}
				},
				{ threshold: 1.0 },
			);
			observer.observe(sentinelRef.current);
			return () => observer.disconnect();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return (
		<Sidebar>
			<SidebarHeader className="border-b px-4 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MessageCircle className="h-6 w-6 text-primary" />
						<span className="font-semibold text-lg">DOST MCP</span>
					</div>
					<button
						onClick={toggleTheme}
						className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
					>
						{theme === "light" ? (
							<Moon className="h-4 w-4" />
						) : (
							<Sun className="h-4 w-4" />
						)}
					</button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Chats Section */}
				{logged && (
					<SidebarGroup>
						<SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
						<SidebarGroupContent>
							{!data ? (
								<div className="px-4 py-2 text-sm text-muted-foreground">
									Loading chats...
								</div>
							) : allChats.length === 0 ? (
								<div className="px-4 py-2 text-sm text-muted-foreground">
									No chats yet
								</div>
							) : (
								<div className="h-80 overflow-y-auto ">
									<SidebarMenu>
										{allChats.map((chat) => (
											<SidebarMenuItem key={chat.id}>
												<div className="flex items-center justify-between group">
													<SidebarMenuButton
														asChild
														className={`${activeChatId === chat.id ? "bg-primary/10" : ""} rounded-md flex-1 min-w-0`}
													>
														<Link
															to={`/chat/${chat.id}`}
															className="flex items-center gap-2 flex-1 min-w-0"
														>
															<MessageCircle className="h-4 w-4 flex-shrink-0" />
															<span className="truncate">
																{chat.name}
															</span>
														</Link>
													</SidebarMenuButton>
													<ChatItemActions
														chat={chat}
													/>
												</div>
											</SidebarMenuItem>
										))}
										{hasNextPage && (
											<SidebarMenuItem>
												<div
													ref={sentinelRef}
													className="h-4 w-full"
												/>
											</SidebarMenuItem>
										)}
									</SidebarMenu>
									{isFetchingNextPage && (
										<div className="px-4 py-2 text-sm text-muted-foreground">
											Loading more...
										</div>
									)}
								</div>
							)}
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				{/* Tools Section - At the bottom of sidebar content */}
				{logged && (
					<SidebarGroup>
						<SidebarGroupLabel>Tools</SidebarGroupLabel>
						<SidebarGroupContent>
							<Button
								className=" w-full cursor-pointer"
								variant="ghost"
							>
								<Link
									to="/tools"
									className="flex justify-between items-center gap-2 w-full"
								>
									<div className="flex items-center gap-2">
										<ToolCase className="h-4 w-4" />
										<span>Tools</span>
									</div>
									<span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
										{toolCount}
									</span>
								</Link>
							</Button>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>
			<SidebarFooter className="border-t p-4">
				{logged ? (
					<SidebarFooterActions />
				) : (
					<div className="text-center">
						<p className="text-xs text-muted-foreground mb-2">
							Sign in to your account
						</p>
						<Button asChild size="sm">
							<Link to="/login">Login</Link>
						</Button>
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}
