"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export default function Mermaid({ chart }) {
	const elementId = useRef(`mermaid-${Math.floor(Math.random() * 1000000)}`);
	const containerRef = useRef(null);
	const panZoomRef = useRef(null);
	const [svg, setSvg] = useState("");
	const [error, setError] = useState(false);
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		let isMounted = true;

		async function renderChart() {
			try {
				const mermaid = (await import("mermaid")).default;

				const activeTheme =
					mounted && resolvedTheme === "dark" ? "dark" : "default";

				mermaid.initialize({
					startOnLoad: false,
					theme: activeTheme,
					securityLevel: "loose",
					fontFamily: "Poppins, sans-serif",
				});

				if (containerRef.current) {
					containerRef.current.innerHTML = "";
				}

				const { svg: renderedSvg } = await mermaid.render(
					elementId.current,
					chart,
				);

				if (isMounted) {
					setSvg(renderedSvg);
					setError(false);
				}
			} catch (err) {
				console.error("Mermaid rendering error:", err);
				if (isMounted) {
					setError(true);
				}
			}
		}

		renderChart();

		return () => {
			isMounted = false;
		};
	}, [chart, resolvedTheme, mounted]);

	// Initialize svg-pan-zoom
	useEffect(() => {
		if (!svg || !containerRef.current) return;

		let panZoomInstance = null;

		async function initPanZoom() {
			try {
				const svgElement = containerRef.current.querySelector("svg");
				if (!svgElement) return;

				// Make sure SVG takes up container space and scales correctly
				svgElement.style.width = "100%";
				svgElement.style.height = "100%";
				svgElement.style.maxWidth = "none";

				const svgPanZoom = (await import("svg-pan-zoom")).default;

				// Destroy existing instance if any
				if (panZoomRef.current) {
					try {
						panZoomRef.current.destroy();
					} catch (e) {
						console.warn(
							"Error destroying previous pan-zoom instance:",
							e,
						);
					}
					panZoomRef.current = null;
				}

				panZoomInstance = svgPanZoom(svgElement, {
					zoomEnabled: true,
					controlIconsEnabled: true,
					fit: true,
					center: true,
					minZoom: 0.2,
					maxZoom: 10,
					zoomScaleSensitivity: 0.2,
				});

				panZoomRef.current = panZoomInstance;
			} catch (err) {
				console.error("Error initializing svg-pan-zoom:", err);
			}
		}

		initPanZoom();

		return () => {
			if (panZoomInstance) {
				try {
					panZoomInstance.destroy();
				} catch (e) {
					// Ignore
				}
				if (panZoomRef.current === panZoomInstance) {
					panZoomRef.current = null;
				}
			}
		};
	}, [svg]);

	if (error) {
		return (
			<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg my-4 text-xs font-mono text-destructive">
				Error parsing diagram code. Check Mermaid syntax.
			</div>
		);
	}

	if (!svg) {
		return (
			<div className="h-32 w-full flex items-center justify-center border border-border/60 bg-muted/10 rounded-lg animate-pulse my-4 text-xs text-muted-foreground">
				Rendering diagram...
			</div>
		);
	}

	return (
		<div className="relative my-6 border border-border rounded-lg bg-card/40 shadow-sm w-full h-[550px] overflow-hidden flex items-center justify-center">
			<style
				dangerouslySetInnerHTML={{
					__html: `
				#svg-pan-zoom-controls {
					fill: var(--muted-foreground) !important;
					fill-opacity: 0.7;
				}
				#svg-pan-zoom-controls:hover {
					fill-opacity: 1;
				}
			`,
				}}
			/>
			<div
				ref={containerRef}
				className="w-full h-full"
				dangerouslySetInnerHTML={{ __html: svg }}
			/>
		</div>
	);
}
