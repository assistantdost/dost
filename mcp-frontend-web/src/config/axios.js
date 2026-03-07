import axios from "axios";
// import { SECURITY_HEADERS, SENSITIVE_PATTERNS } from "./security.js";
import { useAuthStore } from "@/store/authStore.js";
import { toast } from "sonner";

// Create axios instance with security configurations

const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
	timeout: 10000, // 10 seconds timeout
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
	(config) => {
		// Add auth token if available
		const token = useAuthStore.getState().token;
		console.log("Token in interceptor:", token);

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		// Add request timestamp for tracking
		config.metadata = { startTime: new Date() };

		// Log request (excluding sensitive data)
		if (process.env.NODE_ENV === "development") {
			console.log(
				`API Request: ${config.method?.toUpperCase()} ${config.url}`,
			);

			// Only log data if it doesn't contain sensitive information
			// if (config.data) {
			// 	const dataString = JSON.stringify(config.data);
			// 	const containsSensitive = SENSITIVE_PATTERNS.some((pattern) =>
			// 		pattern.test(dataString)
			// 	);

			// 	if (!containsSensitive) {
			// 		console.log("Request data:", config.data);
			// 	} else {
			// 		console.log("Request data: [SENSITIVE DATA HIDDEN]");
			// 	}
			// }
		}

		return config;
	},
	(error) => {
		console.error("Request interceptor error:", error);
		return Promise.reject(error);
	},
);

// Response interceptor
apiClient.interceptors.response.use(
	(response) => {
		// Calculate request duration
		const duration = new Date() - response.config.metadata?.startTime;

		if (process.env.NODE_ENV === "development") {
			console.log(`API Response: ${response.status} in ${duration}ms`);
		}

		return response;
	},
	(error) => {
		// Handle common error scenarios
		const { unAuthorisedLogout } = useAuthStore.getState();
		if (error.response) {
			const { status, data } = error.response;

			switch (status) {
				case 401:
					// Unauthorized - clear token and redirect to login
					unAuthorisedLogout(
						data?.message ||
							"Session expired. Please log in again.",
					);

					// Only redirect if not already on login page
					if (!window.location.pathname.includes("/login")) {
						window.location.href = "/login";
					}
					break;

				case 403:
					// Forbidden - show appropriate message
					toast.error(
						data?.message ||
							"Access forbidden - insufficient permissions",
					);
					console.error(
						data?.message ||
							"Access forbidden - insufficient permissions",
					);
					break;

				case 429:
					// Rate limited
					console.error(
						data?.message ||
							"Too many requests - please wait before trying again",
					);
					toast.error(
						data?.message ||
							"Too many requests - please wait before trying again",
					);
					break;

				case 500:
					// Server error
					console.error(
						data?.message ||
							"Server error - please try again later",
					);
					toast.error(
						data?.message ||
							"Server error - please try again later",
					);
					break;

				default:
					console.error(
						`API Error ${status}:`,
						data?.message || data?.detail || "Unknown error",
					);
					toast.error(
						data?.message || data?.detail || "An error occurred",
					);
			}
		} else if (error.request) {
			// Network error
			console.error("Network error - please check your connection");
			toast.error("Network error - please check your connection");
		} else {
			// Request setup error
			console.error("Request setup error:", error.message);
			toast.error("Request setup error");
		}

		return Promise.reject(error);
	},
);

// Helper functions for common API operations
export const apiHelpers = {
	// Safe GET request with error handling
	get: async (url, config = {}) => {
		const response = await apiClient.get(url, config);
		return response.data;
	},

	// Safe POST request with error handling
	post: async (url, data, config = {}) => {
		const response = await apiClient.post(url, data, config);
		return response.data;
	},

	// Safe PUT request with error handling
	put: async (url, data, config = {}) => {
		const response = await apiClient.put(url, data, config);
		return response.data;
	},

	// Safe PATCH request with error handling
	patch: async (url, data, config = {}) => {
		const response = await apiClient.patch(url, data, config);
		return response.data;
	},

	// Safe DELETE request with error handling
	delete: async (url, config = {}) => {
		const response = await apiClient.delete(url, config);
		return response.data;
	},
};

export default apiClient;
