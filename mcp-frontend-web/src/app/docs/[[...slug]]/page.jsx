import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import DocsLayout from "@/components/DocsLayout";

function getDocsList() {
	const docsDir = path.join(process.cwd(), "public/docs");
	if (!fs.existsSync(docsDir)) {
		return [];
	}

	const files = fs.readdirSync(docsDir).filter((file) => file.endsWith(".md"));
	return files.map((file) => {
		const slug = file
			.replace(/\.md$/, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
		return {
			filename: file,
			slug,
			title: file.replace(/\.md$/, ""),
		};
	});
}

export async function generateStaticParams() {
	const docs = getDocsList();
	return [
		{ slug: [] },
		...docs.map((doc) => ({
			slug: [doc.slug],
		})),
	];
}

export default async function DocsPage({ params }) {
	const resolvedParams = await params;
	const slugArr = resolvedParams.slug || [];
	const docsList = getDocsList();

	if (docsList.length === 0) {
		return (
			<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
				<div className="text-center">
					<h1 className="text-xl font-bold">No documentation files found.</h1>
					<p className="text-muted-foreground text-sm mt-1">Please add markdown files to the public/docs folder.</p>
				</div>
			</div>
		);
	}

	// Default to first doc if slug is empty
	let activeDoc = null;
	if (slugArr.length === 0) {
		// Prefer "DOST - Personal Agentic AI Assistant" as the home documentation page
		const defaultDoc = docsList.find(d => d.slug.includes("dost-personal-agentic") || d.slug.includes("dost-assistant")) || docsList[0];
		activeDoc = defaultDoc;
	} else {
		const slug = slugArr.join("-");
		activeDoc = docsList.find((doc) => doc.slug === slug);
	}

	if (!activeDoc) {
		notFound();
	}

	let fileContent = "";
	try {
		const filePath = path.join(process.cwd(), "public/docs", activeDoc.filename);
		fileContent = fs.readFileSync(filePath, "utf-8");
	} catch (error) {
		console.error("Failed to read doc file:", error);
		fileContent = "# Error loading document\nCould not read file from disk.";
	}

	return (
		<DocsLayout
			docsList={docsList}
			currentSlug={activeDoc.slug}
			currentTitle={activeDoc.title}
			currentContent={fileContent}
		/>
	);
}
