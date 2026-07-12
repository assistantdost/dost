const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dost-assistant.vercel.app";

export default function robots() {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/profile", "/reset-password", "/forgot-password"],
			},
		],
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
