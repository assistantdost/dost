"use client";
import { useState, useEffect, useRef } from "react";
import { cn } from "@repo/shadcn-ui/lib/utils";
import { CodeBlockSvgDownloadButton } from "@/components/ai/code-block";
import Viz from "viz.js";
import { Module, render } from "viz.js/full.render.js";
import { graphviz } from "d3-graphviz";

export default function GraphvizDiagram({ code, className }) {
	const [svg, setSvg] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const containerRef = useRef(null);

	useEffect(() => {
		if (!code) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setSvg("");

		const engineMatch = code.match(/layout\s*=\s*(\w+);?/i);
		const engine = engineMatch ? engineMatch[1].toLowerCase() : "dot";

		const renderDiagram = async () => {
			try {
				if (["neato", "fdp", "sfdp", "circo"].includes(engine)) {
					// Use d3-graphviz for these engines
					if (containerRef.current) {
						containerRef.current.innerHTML = "";
						await new Promise((resolve, reject) => {
							graphviz(containerRef.current, {
								useWorker: false,
								engine,
							})
								.renderDot(code)
								.on("end", () => {
									// Extract SVG from the rendered DOM
									const svgElement =
										containerRef.current.querySelector(
											"svg"
										);
									if (svgElement) {
										const svgString =
											svgElement.outerHTML.replace(
												"<svg",
												'<svg style="width: auto; height: auto; max-width: 100%; max-height: 85vh;"'
											);
										setSvg(svgString);
										resolve();
									} else {
										reject(
											new Error(
												"SVG element not found after rendering"
											)
										);
									}
								})
								.on("error", (error) => {
									reject(
										new Error(
											`Graphviz rendering error: ${
												error.message || error
											}`
										)
									);
								});
						});
					} else {
						throw new Error("Container not available");
					}
				} else {
					// Use viz.js for dot and other engines
					const viz = new Viz({ Module, render });
					const el = await viz.renderSVGElement(code);
					if (!el) {
						throw new Error("Failed to render SVG element");
					}
					const responsiveSvg = el.outerHTML.replace(
						"<svg",
						'<svg style="width: auto; height: auto; max-width: 100%; max-height: 85vh;"'
					);
					setSvg(responsiveSvg);
				}
			} catch (err) {
				console.error("Graphviz render failed:", err);
				throw err; // Let ErrorBoundary handle it
			} finally {
				setIsLoading(false);
			}
		};

		renderDiagram();
	}, [code]);

	if (isLoading) {
		return (
			<div
				className={cn(
					"p-4 text-muted-foreground animate-pulse",
					className
				)}
			>
				Rendering Graphviz diagram...
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative rounded-md border bg-background text-foreground overflow-x-auto my-4",
				className
			)}
			role="img"
			aria-label="Graphviz diagram"
		>
			{svg ? (
				<>
					<div className="absolute top-2 right-2 flex items-center gap-2 z-10">
						<CodeBlockSvgDownloadButton
							svgString={svg}
							onDownload={() =>
								console.log("Downloaded Graphviz PNG")
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
			) : (
				<div className="p-4 text-muted-foreground">
					Failed to render diagram. Please check syntax.
				</div>
			)}
			{/* Hidden container for d3-graphviz rendering */}
			<div ref={containerRef} className="hidden" />
		</div>
	);
}
