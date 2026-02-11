"use client";
import React, {
	useState,
	useEffect,
	useRef,
	useMemo,
	useDeferredValue,
	lazy,
	Suspense,
} from "react";
import { cn } from "@repo/shadcn-ui/lib/utils";
import { isValidElement, memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
	CodeBlock,
	CodeBlockCopyButton,
	CodeBlockSvgDownloadButton,
} from "./code-block";
import "katex/dist/katex.min.css";
import hardenReactMarkdown from "harden-react-markdown";

// ✅ Lazy load heavy diagram libraries
const MermaidDiagram = lazy(() =>
	import("@/components/diagrams/MermaidDiagram")
);
const GraphvizDiagram = lazy(() =>
	import("@/components/diagrams/GraphvizDiagram")
);

/**
 * Error Boundary for diagram rendering failures
 */
class DiagramErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		console.error("Diagram rendering error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

/**
 * Parses markdown text and removes incomplete tokens to prevent partial rendering
 * of links, images, bold, and italic formatting during streaming.
 *
 * @performance Optimized with early returns and reduced regex operations
 */
function parseIncompleteMarkdown(text) {
	if (!text || typeof text !== "string") {
		return text;
	}

	let result = text;

	// ✅ Combined pattern matching for better performance
	const patterns = [
		{
			name: "linkImage",
			regex: /(!?\[)([^\]]*?)$/,
			handler: (match) => {
				const startIndex = result.lastIndexOf(match[1]);
				return result.substring(0, startIndex);
			},
		},
		{
			name: "bold",
			regex: /(\*\*)([^*]*?)$/,
			handler: () => {
				const asteriskPairs = (result.match(/\*\*/g) || []).length;
				return asteriskPairs % 2 === 1 ? `${result}**` : result;
			},
		},
		{
			name: "italic",
			regex: /(__)([^_]*?)$/,
			handler: () => {
				const underscorePairs = (result.match(/__/g) || []).length;
				return underscorePairs % 2 === 1 ? `${result}__` : result;
			},
		},
		{
			name: "strikethrough",
			regex: /(~~)([^~]*?)$/,
			handler: () => {
				const tildePairs = (result.match(/~~/g) || []).length;
				return tildePairs % 2 === 1 ? `${result}~~` : result;
			},
		},
	];

	for (const pattern of patterns) {
		const match = result.match(pattern.regex);
		if (match) {
			result = pattern.handler(match);
		}
	}

	// Handle single asterisk italic (optimized)
	const singleAsteriskCount = result.split("").reduce((acc, char, index) => {
		if (
			char === "*" &&
			result[index - 1] !== "*" &&
			result[index + 1] !== "*"
		) {
			return acc + 1;
		}
		return acc;
	}, 0);
	if (singleAsteriskCount % 2 === 1) {
		result = `${result}*`;
	}

	// Handle single underscore italic (optimized)
	const singleUnderscoreCount = result
		.split("")
		.reduce((acc, char, index) => {
			if (
				char === "_" &&
				result[index - 1] !== "_" &&
				result[index + 1] !== "_"
			) {
				return acc + 1;
			}
			return acc;
		}, 0);
	if (singleUnderscoreCount % 2 === 1) {
		result = `${result}_`;
	}

	// Handle inline code (optimized)
	const codeBlockPattern = /```[\s\S]*?```/g;
	const allTripleBackticks = (result.match(/```/g) || []).length;
	const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;

	if (!insideIncompleteCodeBlock) {
		let singleBacktickCount = 0;
		for (let i = 0; i < result.length; i++) {
			if (result[i] === "`") {
				const isTriple =
					result.substring(i, i + 3) === "```" ||
					(i > 0 && result.substring(i - 1, i + 2) === "```") ||
					(i > 1 && result.substring(i - 2, i + 1) === "```");
				if (!isTriple) {
					singleBacktickCount++;
				}
			}
		}
		if (singleBacktickCount % 2 === 1) {
			result = `${result}\``;
		}
	}

	return result;
}

// Create a hardened version of ReactMarkdown
const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

/**
 * ✅ Extracted Pre component for better maintainability
 * Handles code blocks, Mermaid, and Graphviz rendering
 */
const PreComponent = memo(({ node, className, children, state }) => {
	// Extract language
	let language = "javascript";
	if (
		node?.children?.[0]?.type === "element" &&
		node.children[0].tagName === "code" &&
		Array.isArray(node.children[0].properties?.className)
	) {
		const codeClassName = node.children[0].properties.className[0];
		if (
			typeof codeClassName === "string" &&
			codeClassName.startsWith("language-")
		) {
			language = codeClassName.replace("language-", "");
		}
	}

	// Extract code
	let code = "";
	if (
		isValidElement(children) &&
		children.props &&
		typeof children.props.children === "string"
	) {
		code = children.props.children;
	} else if (typeof children === "string") {
		code = children;
	}
	code = code.trim();

	// ✅ During streaming: Always render default code block
	if (state === "streaming" || !code) {
		return (
			<CodeBlock
				className={cn("my-4 h-auto", className)}
				code={code}
				language={language}
			>
				<CodeBlockCopyButton
					onCopy={() => console.log("Copied code to clipboard")}
					onError={() =>
						console.error("Failed to copy code to clipboard")
					}
				/>
			</CodeBlock>
		);
	}

	// ✅ Detect diagram types (only when done)
	const isMermaid =
		language === "mermaid" ||
		(language !== "dot" &&
			language !== "graphviz" &&
			(code.startsWith("graph ") ||
				code.startsWith("flowchart") ||
				code.startsWith("sequenceDiagram") ||
				code.startsWith("classDiagram") ||
				code.startsWith("erDiagram") ||
				code.startsWith("gantt") ||
				code.startsWith("journey") ||
				code.startsWith("pie")));

	const isGraphviz = language === "dot" || language === "graphviz";

	// ✅ Render diagrams with lazy loading and error boundaries
	if (isMermaid) {
		return (
			<DiagramErrorBoundary
				fallback={
					<div>
						<CodeBlock
							className={cn("my-4 h-auto", className)}
							code={code}
							language={language}
						>
							<CodeBlockCopyButton
								onCopy={() =>
									console.log("Copied code to clipboard")
								}
								onError={() =>
									console.error(
										"Failed to copy code to clipboard"
									)
								}
							/>
						</CodeBlock>
						<p className="text-xs text-destructive p-1">
							Error rendering Mermaid diagram. Please check
							syntax.
						</p>
					</div>
				}
			>
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground animate-pulse">
							Rendering Mermaid diagram...
						</div>
					}
				>
					<MermaidDiagram code={code} className={className} />
				</Suspense>
			</DiagramErrorBoundary>
		);
	}

	if (isGraphviz) {
		return (
			<DiagramErrorBoundary
				fallback={
					<div>
						<CodeBlock
							className={cn("my-4 h-auto", className)}
							code={code}
							language={language}
						>
							<CodeBlockCopyButton
								onCopy={() =>
									console.log("Copied code to clipboard")
								}
								onError={() =>
									console.error(
										"Failed to copy code to clipboard"
									)
								}
							/>
						</CodeBlock>
						<p className="text-xs text-destructive p-1">
							Error rendering Graphviz diagram. Please check
							syntax.
						</p>
					</div>
				}
			>
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground animate-pulse">
							Rendering Graphviz diagram...
						</div>
					}
				>
					<GraphvizDiagram code={code} className={className} />
				</Suspense>
			</DiagramErrorBoundary>
		);
	}

	// Default code block
	return (
		<CodeBlock
			className={cn("my-4 h-auto", className)}
			code={code}
			language={language}
		>
			<CodeBlockCopyButton
				onCopy={() => console.log("Copied code to clipboard")}
				onError={() =>
					console.error("Failed to copy code to clipboard")
				}
			/>
		</CodeBlock>
	);
});

PreComponent.displayName = "PreComponent";

export const Response = memo(
	({
		className,
		options,
		children,
		allowedImagePrefixes,
		allowedLinkPrefixes,
		defaultOrigin,
		parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
		state,
		...props
	}) => {
		// ✅ Defer children to prevent freezing during streaming
		const deferredChildren = useDeferredValue(children);

		// ✅ Parse incomplete markdown (memoized)
		const parsedChildren = useMemo(
			() =>
				typeof deferredChildren === "string" &&
				shouldParseIncompleteMarkdown
					? parseIncompleteMarkdown(deferredChildren)
					: deferredChildren,
			[deferredChildren, shouldParseIncompleteMarkdown]
		);

		// ✅ Memoized components for better performance
		const components = useMemo(
			() => ({
				ol: ({ node, children, className, ...props }) => (
					<ol
						className={cn(
							"ml-4 list-outside list-decimal",
							className
						)}
						{...props}
					>
						{children}
					</ol>
				),
				li: ({ node, children, className, ...props }) => (
					<li className={cn("py-1", className)} {...props}>
						{children}
					</li>
				),
				ul: ({ node, children, className, ...props }) => (
					<ul
						className={cn("ml-4 list-outside list-disc", className)}
						{...props}
					>
						{children}
					</ul>
				),
				hr: ({ node, className, ...props }) => (
					<hr
						className={cn("my-6 border-border", className)}
						{...props}
					/>
				),
				strong: ({ node, children, className, ...props }) => (
					<span className={cn("font-semibold", className)} {...props}>
						{children}
					</span>
				),
				a: ({ node, children, className, ...props }) => (
					<a
						className={cn(
							"font-medium text-primary underline",
							className
						)}
						rel="noreferrer"
						target="_blank"
						{...props}
					>
						{children}
					</a>
				),
				h1: ({ node, children, className, ...props }) => (
					<h1
						className={cn(
							"mt-6 mb-2 font-semibold text-3xl",
							className
						)}
						{...props}
					>
						{children}
					</h1>
				),
				h2: ({ node, children, className, ...props }) => (
					<h2
						className={cn(
							"mt-6 mb-2 font-semibold text-2xl",
							className
						)}
						{...props}
					>
						{children}
					</h2>
				),
				h3: ({ node, children, className, ...props }) => (
					<h3
						className={cn(
							"mt-6 mb-2 font-semibold text-xl",
							className
						)}
						{...props}
					>
						{children}
					</h3>
				),
				h4: ({ node, children, className, ...props }) => (
					<h4
						className={cn(
							"mt-6 mb-2 font-semibold text-lg",
							className
						)}
						{...props}
					>
						{children}
					</h4>
				),
				h5: ({ node, children, className, ...props }) => (
					<h5
						className={cn(
							"mt-6 mb-2 font-semibold text-base",
							className
						)}
						{...props}
					>
						{children}
					</h5>
				),
				h6: ({ node, children, className, ...props }) => (
					<h6
						className={cn(
							"mt-6 mb-2 font-semibold text-sm",
							className
						)}
						{...props}
					>
						{children}
					</h6>
				),
				table: ({ node, children, className, ...props }) => (
					<div className="my-4 overflow-x-auto">
						<table
							className={cn(
								"w-full border-collapse border border-border",
								className
							)}
							{...props}
						>
							{children}
						</table>
					</div>
				),
				thead: ({ node, children, className, ...props }) => (
					<thead className={cn("bg-muted/50", className)} {...props}>
						{children}
					</thead>
				),
				tbody: ({ node, children, className, ...props }) => (
					<tbody
						className={cn("divide-y divide-border", className)}
						{...props}
					>
						{children}
					</tbody>
				),
				tr: ({ node, children, className, ...props }) => (
					<tr
						className={cn("border-border border-b", className)}
						{...props}
					>
						{children}
					</tr>
				),
				th: ({ node, children, className, ...props }) => (
					<th
						className={cn(
							"px-4 py-2 text-left font-semibold text-sm",
							className
						)}
						{...props}
					>
						{children}
					</th>
				),
				td: ({ node, children, className, ...props }) => (
					<td
						className={cn("px-4 py-2 text-sm", className)}
						{...props}
					>
						{children}
					</td>
				),
				img: ({ node, className, alt, ...props }) => (
					<img
						className={cn(
							"my-4 max-h-96 w-auto rounded-md border border-border object-contain",
							className
						)}
						alt={alt || "Image"}
						loading="lazy"
						{...props}
					/>
				),
				blockquote: ({ node, children, className, ...props }) => (
					<blockquote
						className={cn(
							"my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic",
							className
						)}
						{...props}
					>
						{children}
					</blockquote>
				),
				code: ({ node, className, children, ...props }) => {
					const inline =
						node?.position?.start.line === node?.position?.end.line;

					if (!inline) {
						return <code className={className} {...props} />;
					}

					return (
						<code
							className={cn(
								"rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
								className
							)}
							{...props}
						/>
					);
				},
				pre: ({ node, className, children }) => (
					<PreComponent
						node={node}
						className={className}
						children={children}
						state={state}
					/>
				),
			}),
			[state]
		);

		return (
			<div
				className={cn(
					"size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
					className
				)}
				{...props}
			>
				<HardenedMarkdown
					allowedImagePrefixes={allowedImagePrefixes ?? ["*"]}
					allowedLinkPrefixes={allowedLinkPrefixes ?? ["*"]}
					components={components}
					defaultOrigin={defaultOrigin}
					rehypePlugins={[rehypeKatex]}
					remarkPlugins={[remarkGfm, remarkMath]}
					{...options}
				>
					{parsedChildren}
				</HardenedMarkdown>
			</div>
		);
	},
	(prevProps, nextProps) =>
		prevProps.children === nextProps.children &&
		prevProps.state === nextProps.state
);

Response.displayName = "Response";
