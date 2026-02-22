import React, { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AutoBreadcrumb from "@/components/AutoBreadcrumb";
import { Outlet } from "react-router-dom";
import useGlobalStore from "@/store/globalStore";

function Layout() {
	const { theme } = useGlobalStore();

	useEffect(() => {
		const root = document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [theme]);

	return (
		<SidebarProvider>
			<div className="flex w-full">
				<AppSidebar />
				<main className="flex-1 flex-col flex min-h-screen ">
					<div className="flex items-center gap-2 mx-2">
						<SidebarTrigger />
						<AutoBreadcrumb
							startBreadcrumb={{ label: "Home", href: "/home" }}
						/>
					</div>

					<div className="mx-2 ">
						<Outlet />
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}

export default Layout;
