import { NextResponse } from "next/server";

export function middleware(request) {
	const token = request.cookies.get("token")?.value;
	const { pathname } = request.nextUrl;

	// Define protected and public routes
	const isProtectedRoute = pathname.startsWith("/dashboard");
	const isPublicRoute =
		pathname === "/login" ||
		pathname === "/signup" ||
		pathname === "/forgot-password" ||
		pathname === "/reset-password" ||
		pathname === "/verify-email";

	// Redirect unauthorized users to login if they try to access protected routes
	if (isProtectedRoute && !token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Redirect authorized users to dashboard if they try to access public auth routes
	if (isPublicRoute && token) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
