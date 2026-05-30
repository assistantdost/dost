import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import BlogLayout from "@/components/BlogLayout";

function getBlogList() {
	const blogDir = path.join(process.cwd(), "public/blog");
	if (!fs.existsSync(blogDir)) {
		return [];
	}

	const files = fs.readdirSync(blogDir).filter((file) => file.endsWith(".md"));
	return files.map((file) => {
		const slug = file
			.replace(/\.md$/, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
		return {
			filename: file,
			slug,
			title: file
				.replace(/\.md$/, "")
				.replace(/-/g, " ")
				.replace(/\b\w/g, (char) => char.toUpperCase()),
		};
	});
}

export async function generateStaticParams() {
	const posts = getBlogList();
	return [
		{ slug: [] },
		...posts.map((post) => ({
			slug: [post.slug],
		})),
	];
}

export default async function BlogPage({ params }) {
	const resolvedParams = await params;
	const slugArr = resolvedParams.slug || [];
	const blogList = getBlogList();

	if (blogList.length === 0) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
				<div className="text-center">
					<h1 className="text-xl font-bold">No blog posts found.</h1>
					<p className="text-muted-foreground text-sm mt-1">Please add markdown files to the public/blog folder.</p>
				</div>
			</div>
		);
	}

	// Default to first post if slug is empty
	let activePost = null;
	if (slugArr.length === 0) {
		const defaultPost = blogList.find(p => p.slug.includes("introducing-dost")) || blogList[0];
		activePost = defaultPost;
	} else {
		const slug = slugArr.join("-");
		activePost = blogList.find((post) => post.slug === slug);
	}

	if (!activePost) {
		notFound();
	}

	let fileContent = "";
	try {
		const filePath = path.join(process.cwd(), "public/blog", activePost.filename);
		fileContent = fs.readFileSync(filePath, "utf-8");
	} catch (error) {
		console.error("Failed to read blog file:", error);
		fileContent = "# Error loading article\nCould not read file from disk.";
	}

	return (
		<BlogLayout
			blogList={blogList}
			currentSlug={activePost.slug}
			currentTitle={activePost.title}
			currentContent={fileContent}
		/>
	);
}
