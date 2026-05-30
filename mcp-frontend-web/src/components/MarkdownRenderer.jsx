"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, prism } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";
import { useTheme } from "next-themes";
import Mermaid from "@/components/Mermaid";

function CopyButton({ text }) {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text:", err);
		}
	};

	return (
		<button
			onClick={handleCopy}
			className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
			title="Copy Code"
		>
			{copied ? (
				<>
					<Check
						size={12}
						className="text-emerald-500 animate-in fade-in zoom-in-75 duration-200"
					/>
					<span className="text-emerald-500 font-sans">Copied!</span>
				</>
			) : (
				<>
					<Copy size={12} />
					<span className="font-sans">Copy</span>
				</>
			)}
		</button>
	);
}

function CodeBlock({ language, codeText }) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	// Default to oneDark on server-side rendering to match the dark theme and avoid flashes
	const codeTheme = mounted && resolvedTheme === "light" ? prism : oneDark;
	const codeString = String(codeText || "").replace(/\n$/, "");

	// Clean backgrounds from inline styles of pre, code, and operator tokens
	const cleanedTheme = React.useMemo(() => {
		const cleaned = { ...codeTheme };
		Object.keys(cleaned).forEach((key) => {
			if (key.includes("pre") || key.includes("code") || key.includes("operator")) {
				if (cleaned[key]) {
					cleaned[key] = {
						...cleaned[key],
						background: "transparent",
						backgroundColor: "transparent",
					};
				}
			}
		});
		return cleaned;
	}, [codeTheme]);

	return (
		<div className="my-6 border border-border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm">
			<div className="px-4 py-1.5 border-b border-border bg-muted/60 flex justify-between items-center text-[10px] font-sans text-muted-foreground">
				<span className="uppercase font-bold tracking-wider select-none">
					{language || "code"}
				</span>
				<CopyButton text={codeString} />
			</div>
			<SyntaxHighlighter
				language={language || "text"}
				style={cleanedTheme}
				customStyle={{
					margin: 0,
					padding: "1rem",
					background: "transparent",
					fontSize: "0.8rem",
					lineHeight: "1.5",
				}}
			>
				{codeString}
			</SyntaxHighlighter>
		</div>
	);
}

const customComponents = {
	h1: ({ node, ...props }) => (
		<h1
			className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-8 mb-4 border-b border-border/40 pb-2"
			{...props}
		/>
	),
	h2: ({ node, ...props }) => (
		<h2
			className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mt-7 mb-3"
			{...props}
		/>
	),
	h3: ({ node, ...props }) => (
		<h3
			className="text-lg md:text-xl font-medium tracking-tight text-foreground mt-6 mb-2"
			{...props}
		/>
	),
	p: ({ node, ...props }) => (
		<p
			className="text-muted-foreground leading-relaxed text-sm md:text-base my-3.5"
			{...props}
		/>
	),
	ul: ({ node, ...props }) => (
		<ul
			className="list-disc pl-6 my-4 space-y-1.5 text-muted-foreground font-poppins"
			{...props}
		/>
	),
	ol: ({ node, ...props }) => (
		<ol
			className="list-decimal pl-6 my-4 space-y-1.5 text-muted-foreground font-poppins"
			{...props}
		/>
	),
	li: ({ node, ...props }) => (
		<li
			className="pl-1 text-sm md:text-base text-muted-foreground leading-relaxed"
			{...props}
		/>
	),
	a: ({ node, ...props }) => (
		<a
			className="text-primary hover:underline transition-colors font-medium"
			{...props}
		/>
	),
	strong: ({ node, ...props }) => (
		<strong className="font-bold text-foreground" {...props} />
	),
	table: ({ node, ...props }) => (
		<div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto border border-border rounded-lg my-6 shadow-sm">
			<table
				className="w-full text-xs md:text-sm border-collapse text-left bg-card/30"
				{...props}
			/>
		</div>
	),
	thead: ({ node, ...props }) => (
		<thead
			className="bg-muted/80 text-foreground font-bold border-b border-border sticky top-0 backdrop-blur-sm z-10"
			{...props}
		/>
	),
	tr: ({ node, ...props }) => (
		<tr
			className="hover:bg-muted/10 transition-colors border-b border-border/40 last:border-b-0"
			{...props}
		/>
	),
	th: ({ node, ...props }) => (
		<th className="p-3 font-semibold whitespace-nowrap" {...props} />
	),
	td: ({ node, ...props }) => (
		<td className="p-3 text-muted-foreground" {...props} />
	),
	pre: ({ node, children, ...props }) => {
		let language = "";
		let newChildren = children;
		let codeText = "";

		try {
			const childArray = React.Children.toArray(children);
			if (
				childArray.length === 1 &&
				React.isValidElement(childArray[0])
			) {
				const codeElement = childArray[0];
				const className = codeElement.props.className || "";
				const match = /language-(\w+)/.exec(className);
				if (match) {
					language = match[1];
				}
				newChildren = React.cloneElement(codeElement, {
					isBlock: true,
				});
				codeText = codeElement.props.children;
			}
		} catch (e) {
			console.error("Error processing pre children:", e);
		}

		if (language === "mermaid") {
			return <Mermaid chart={String(codeText || "").trim()} />;
		}

		if (codeText) {
			return <CodeBlock language={language} codeText={codeText} />;
		}

		return (
			<div className="my-6 border border-border rounded-lg overflow-hidden bg-card/50">
				{language && (
					<div className="px-4 py-1.5 border-b border-border bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none font-sans">
						{language}
					</div>
				)}
				<pre
					className="p-4 overflow-x-auto text-xs text-foreground bg-muted/20 font-mono whitespace-pre font-normal leading-normal"
					{...props}
				>
					{newChildren}
				</pre>
			</div>
		);
	},
	code: ({ node, className, children, isBlock, ...props }) => {
		if (!isBlock) {
			return (
				<code
					className="px-1.5 py-0.5 bg-muted border border-border/60 rounded font-mono text-xs text-foreground select-all mx-0.5"
					{...props}
				>
					{children}
				</code>
			);
		}

		return (
			<code className={className} {...props}>
				{children}
			</code>
		);
	},
};

export default function MarkdownRenderer({ content }) {
	return (
		<div className="font-poppins text-foreground leading-relaxed max-w-none text-sm md:text-base">
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkMath]}
				rehypePlugins={[rehypeRaw, rehypeKatex]}
				components={customComponents}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
