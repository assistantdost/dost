import { cookies } from "next/headers";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function getSession() {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	return token;
}

export async function serverApi(endpoint, options = {}) {
	const token = await getSession();
	
	try {
		const response = await axios({
			url: `${API_BASE_URL}${endpoint}`,
			headers: {
				...options.headers,
				Authorization: token ? `Bearer ${token}` : "",
			},
			...options,
		});
		return response.data;
	} catch (error) {
		console.error(`Server API Error (${endpoint}):`, error.response?.status, error.response?.data);
		throw error;
	}
}
