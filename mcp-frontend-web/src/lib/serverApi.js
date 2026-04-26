import { cookies } from "next/headers";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function getSession() {
	const cookieStore = await cookies();
	const refreshToken = cookieStore.get("refresh_token")?.value;
	return refreshToken;
}

/**
 * Returns a fetcher-compatible object for server-side requests.
 * It automatically handles the refresh token and attaches the access token.
 */
export async function getServerFetcher() {
	const refreshToken = await getSession();
	let accessToken = null;

	if (refreshToken) {
		try {
			const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
				headers: {
					Cookie: `refresh_token=${refreshToken}`,
				}
			});
			accessToken = refreshResponse.data.token;
		} catch (error) {
			console.error("Server-side token refresh failed:", error.response?.status);
		}
	}

	const createMethod = (method) => async (url, dataOrConfig, config) => {
		const isPostLike = ["post", "put", "patch"].includes(method);
		const actualUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
		const actualConfig = isPostLike ? config : dataOrConfig;
		const actualData = isPostLike ? dataOrConfig : undefined;

		try {
			const response = await axios({
				method,
				url: actualUrl,
				data: actualData,
				headers: {
					...(actualConfig?.headers || {}),
					Authorization: accessToken ? `Bearer ${accessToken}` : "",
				},
				...actualConfig,
			});
			return response.data;
		} catch (error) {
			console.error(`Server API Error (${method} ${url}):`, error.response?.status, error.response?.data);
			throw error;
		}
	};

	return {
		get: createMethod("get"),
		post: createMethod("post"),
		put: createMethod("put"),
		patch: createMethod("patch"),
		delete: createMethod("delete"),
	};
}

// Keep serverApi for backward compatibility (optional but recommended for smooth transition)
export async function serverApi(endpoint, options = {}) {
	const fetcher = await getServerFetcher();
	const method = (options.method || "get").toLowerCase();
	
	if (["post", "put", "patch"].includes(method)) {
		return fetcher[method](endpoint, options.data, options);
	}
	return fetcher[method](endpoint, options);
}
