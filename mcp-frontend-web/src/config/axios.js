import axios from "axios";
import { useAuthStore } from "@/store/authStore.js";
import { toast } from "sonner";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

const apiClient = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

apiClient.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().token;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		config.metadata = { startTime: new Date() };
		return config;
	},
	(error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
	(response) => {
		const duration = new Date() - response.config.metadata?.startTime;
		if (process.env.NODE_ENV === "development") {
			console.log(`API Response: ${response.status} in ${duration}ms`);
		}
		return response;
	},
	async (error) => {
		const { unAuthorisedLogout, refreshToken } = useAuthStore.getState();
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return apiClient(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const newToken = await refreshToken();
				processQueue(null, newToken);
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return apiClient(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				unAuthorisedLogout("Session expired. Please log in again.");
				if (typeof window !== "undefined") {
					window.location.href = "/login";
				}
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// Handle other common error scenarios
		if (error.response) {
			const { status, data } = error.response;
			switch (status) {
				case 403:
					toast.error(data?.message || "Access forbidden");
					break;
				case 429:
					toast.error("Too many requests - please wait");
					break;
				case 500:
					toast.error("Server error - please try again later");
					break;
				default:
					if (status !== 401) {
						toast.error(data?.message || data?.detail || "An error occurred");
					}
			}
		} else if (error.request) {
			toast.error("Network error - please check your connection");
		}

		return Promise.reject(error);
	}
);

export const apiHelpers = {
	get: async (url, config = {}) => {
		const response = await apiClient.get(url, config);
		return response.data;
	},
	post: async (url, data, config = {}) => {
		const response = await apiClient.post(url, data, config);
		return response.data;
	},
	put: async (url, data, config = {}) => {
		const response = await apiClient.put(url, data, config);
		return response.data;
	},
	patch: async (url, data, config = {}) => {
		const response = await apiClient.patch(url, data, config);
		return response.data;
	},
	delete: async (url, config = {}) => {
		const response = await apiClient.delete(url, config);
		return response.data;
	},
};

export default apiClient;

