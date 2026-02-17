import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	useLocation,
} from "react-router-dom";

import "./App.css";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Test from "@/pages/Test";
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import Account from "@/pages/Account";
import Settings from "@/pages/Settings";
import Tools from "@/pages/Tools";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "./store/chatStore";
import { useMcpStore } from "./store/mcpStore";

function App() {
	const { refreshToken, logged } = useAuthStore();
	const {
		init: initMcpStore,
		listenForUpdates,
		cleanup: cleanupMcpStore,
		readConfig,
		connectToServers,
		isInitialized,
	} = useMcpStore();

	// Initialize MCP store and listen for updates
	useEffect(() => {
		initMcpStore();
		listenForUpdates();

		return () => {
			cleanupMcpStore();
		};
	}, []);

	useEffect(() => {
		// Attempt to refresh token on app load and every 15 minutes
		if (logged) {
			// Refresh immediately
			refreshToken();

			// Set up interval to refresh every 15 minutes
			const interval = setInterval(
				() => {
					refreshToken();
				},
				15 * 60 * 1000,
			); // 15 minutes in milliseconds

			// Cleanup interval on unmount
			return () => clearInterval(interval);
		}
	}, [refreshToken, logged]);

	return (
		<Router>
			<Toaster richColors />
			{/* Temporary Navbar */}

			<RouteGuard />

			<div>
				<Routes>
					<Route path="/" element={<Layout />}>
						<Route index element={<Home />} />
						<Route path="home" element={<Home />} />
						<Route path="login" element={<Login />} />
						<Route
							path="chat"
							element={
								<ProtectedRoute>
									<Chat />
								</ProtectedRoute>
							}
						/>
						<Route
							path="chat/:chatId"
							element={
								<ProtectedRoute>
									<Chat />
								</ProtectedRoute>
							}
						/>
						<Route
							path="account"
							element={
								<ProtectedRoute>
									<Account />
								</ProtectedRoute>
							}
						/>
						<Route
							path="settings"
							element={
								<ProtectedRoute>
									<Settings />
								</ProtectedRoute>
							}
						/>
						<Route
							path="tools"
							element={
								<ProtectedRoute>
									<Tools />
								</ProtectedRoute>
							}
						></Route>
						<Route path="test" element={<Test />} />
					</Route>
				</Routes>
			</div>
		</Router>
	);
}

function RouteGuard() {
	const { setActiveChatId } = useChatStore();

	const location = useLocation();

	useEffect(() => {
		// Clear active chat ID when navigating away from chat pages
		if (!location.pathname.startsWith("/chat")) {
			setActiveChatId(null);
		}
	}, [location, setActiveChatId]);

	return null;
}

export default App;
