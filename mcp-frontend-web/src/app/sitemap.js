import fs from "fs";
import path from "path";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dost-assistant.vercel.app";

function getSlugs(subDir) {
	const dir = path.join(process.cwd(), `public/${subDir}`);
	if (!fs.existsSync(dir)) {
		return [];
	}

	const files = fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".md"));
	return files.map((file) => {
		return file
			.replace(/\.md$/, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
	});
}

export default async function sitemap() {
	// Static routes
	const routes = ["", "/about", "/changelog", "/contact", "/mcp-servers", "/docs", "/technical"].map(
		(route) => ({
			url: `${BASE_URL}${route}`,
			lastModified: new Date().toISOString(),
			changeFrequency: "weekly",
			priority: route === "" ? 1.0 : 0.8,
		})
	);

	// Dynamic docs routes
	const docsSlugs = getSlugs("docs");
	const docsRoutes = docsSlugs.map((slug) => ({
		url: `${BASE_URL}/docs/${slug}`,
		lastModified: new Date().toISOString(),
		changeFrequency: "weekly",
		priority: 0.6,
	}));

	// Dynamic technical routes
	const technicalSlugs = getSlugs("technical");
	const technicalRoutes = technicalSlugs.map((slug) => ({
		url: `${BASE_URL}/technical/${slug}`,
		lastModified: new Date().toISOString(),
		changeFrequency: "weekly",
		priority: 0.6,
	}));

	return [...routes, ...docsRoutes, ...technicalRoutes];
}
