"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import {
	SidebarProvider,
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarTrigger,
	SidebarInset,
} from "@/components/ui/sidebar";
import MarkdownRenderer from "./MarkdownRenderer";

export default function DocsLayout({
	docsList,
	currentSlug,
	currentContent,
	currentTitle,
}) {
	return (
		<SidebarProvider>
			<div className="min-h-screen bg-background text-foreground pt-16 flex w-full font-sans">
				{/* Shadcn Sidebar */}
				<Sidebar
					variant="inset"
					collapsible="offcanvas"
					className="top-16 h-[calc(100vh-4rem)] z-30"
				>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel className="text-xs uppercase font-bold text-muted-foreground/60 px-3 py-2">
								Documentation
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{docsList.map((doc) => {
										const isActive =
											doc.slug === currentSlug;
										return (
											<SidebarMenuItem key={doc.slug}>
												<SidebarMenuButton
													asChild
													isActive={isActive}
													tooltip={doc.title}
													className="text-xs font-semibold"
												>
													<Link
														href={`/docs/${doc.slug}`}
														className="flex items-center gap-2.5"
													>
														<FileText
															className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
														/>
														<span>{doc.title}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
				</Sidebar>

				{/* Sidebar Inset containing main content */}
				<SidebarInset className="flex flex-col min-w-0 w-full bg-background border-none p-0 m-0">
					{/* Sub-header with trigger button */}
					<div className="h-12 border-b border-border bg-card/10 backdrop-blur-sm flex items-center px-6 justify-between gap-4 sticky top-16 z-30 w-full select-none">
						<div className="flex items-center gap-3">
							<SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
							<span className="text-xs font-bold text-muted-foreground/60 hidden sm:inline">
								Docs
							</span>
							<span className="text-xs font-bold text-muted-foreground/60 hidden sm:inline">
								/
							</span>
							<span className="text-xs font-semibold text-foreground truncate max-w-[200px] md:max-w-[400px]">
								{currentTitle}
							</span>
						</div>
					</div>

					{/* Main article content - scrolls on the window to trigger Navbar scroll-hide */}
					<div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex-1">
						<article className="pb-16 font-poppins">
							<MarkdownRenderer content={currentContent} />
						</article>
					</div>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
