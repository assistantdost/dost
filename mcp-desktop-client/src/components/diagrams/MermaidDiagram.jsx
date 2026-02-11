"use client";
import { useState, useEffect } from "react";
import { cn } from "@repo/shadcn-ui/lib/utils";
import { CodeBlockSvgDownloadButton } from "@/components/ai/code-block";
import mermaid from "mermaid";

export default function MermaidDiagram({ code, className }) {
	const [svg, setSvg] = useState("");
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!code) return;

		mermaid.initialize({
			startOnLoad: false,
			theme: "default",
			suppressErrorRendering: true,
		});

		const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

		mermaid
			.render(id, code)
			.then(({ svg }) => {
				setSvg(svg);
				setError(null);
			})
			.catch((err) => {
				console.error("Mermaid render error:", err);
				setError(err);
			});
	}, [code]);

	if (error) {
		throw error; // Let ErrorBoundary catch it
	}

	return (
		<div
			className={cn(
				"relative rounded-md border bg-background text-foreground overflow-x-auto my-4",
				className
			)}
			role="img"
			aria-label="Mermaid diagram"
		>
			{!svg ? (
				<div className="p-4 text-muted-foreground animate-pulse">
					Rendering diagram...
				</div>
			) : (
				<>
					<div className="absolute top-2 right-2 flex items-center gap-2 z-10">
						<CodeBlockSvgDownloadButton
							svgString={svg}
							onDownload={() =>
								console.log("Downloaded Mermaid PNG")
							}
							onError={(error) =>
								console.error("Download error:", error)
							}
						/>
					</div>
					<div
						dangerouslySetInnerHTML={{ __html: svg }}
						className="p-4"
					/>
				</>
			)}
		</div>
	);
}
