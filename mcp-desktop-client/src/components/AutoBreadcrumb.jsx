import React from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AutoBreadcrumb({
	startBreadcrumb = { label: "Home", href: "/" },
}) {
	const { pathname } = useLocation();

	// Split pathname into segments, filter out empty strings
	const segments = pathname.split("/").filter(Boolean);

	// Determine starting index to avoid duplicating the startBreadcrumb
	let startIndex = 0;
	const startSegment = startBreadcrumb.href.split("/").filter(Boolean)[0]; // e.g., "admin" from "/admin"
	if (segments[0] === startSegment) {
		startIndex = 1; // Skip the first segment if it matches
	}

	// Build breadcrumb items
	const breadcrumbs = [
		startBreadcrumb,
		...segments.slice(startIndex).map((segment, index) => {
			const href =
				"/" + segments.slice(0, startIndex + index + 1).join("/");
			const label =
				segment.charAt(0).toUpperCase() +
				segment.slice(1).replace(/-/g, " ");
			return { label, href };
		}),
	];

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs.map((crumb, index) => (
					<React.Fragment key={crumb.href}>
						<BreadcrumbItem>
							{index === breadcrumbs.length - 1 ? (
								<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link to={crumb.href}>{crumb.label}</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{index < breadcrumbs.length - 1 && (
							<BreadcrumbSeparator />
						)}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
