import fs from "fs";
import path from "path";
import { notFound, redirect } from "next/navigation";
import TechnicalLayout from "@/components/TechnicalLayout";

function getTechnicalList() {
	const technicalDir = path.join(process.cwd(), "public/technical");
	if (!fs.existsSync(technicalDir)) {
		return [];
	}

	const files = fs
		.readdirSync(technicalDir)
		.filter((file) => file.endsWith(".md"));
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
	const posts = getTechnicalList();
	return [
		{ slug: [] },
		...posts.map((post) => ({
			slug: [post.slug],
		})),
	];
}

export default async function TechnicalPage({ params }) {
	const resolvedParams = await params;
	const slugArr = resolvedParams.slug || [];
	const technicalList = getTechnicalList();

	if (technicalList.length === 0) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
				<div className="text-center">
					<h1 className="text-xl font-bold">
						No technical articles found.
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						Please add markdown files to the public/technical
						folder.
					</p>
				</div>
			</div>
		);
	}

	// Redirect to the first generated slug if slug is empty
	if (slugArr.length === 0 && technicalList.length > 0) {
		redirect(`/technical/${technicalList[0].slug}`);
	}

	const slug = slugArr.join("-");
	const activePost = technicalList.find((post) => post.slug === slug);

	if (!activePost) {
		notFound();
	}

	let fileContent = "";
	try {
		const filePath = path.join(
			process.cwd(),
			"public/technical",
			activePost.filename,
		);
		fileContent = fs.readFileSync(filePath, "utf-8");
	} catch (error) {
		console.error("Failed to read technical file:", error);
		fileContent = "# Error loading article\nCould not read file from disk.";
	}

	return (
		<TechnicalLayout
			blogList={technicalList}
			currentSlug={activePost.slug}
			currentTitle={activePost.title}
			currentContent={fileContent}
		/>
	);
}
