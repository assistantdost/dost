import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
import { Server, Wrench } from "lucide-react";

export function ToolsServerView({ server }) {
	const tools = server?.tools || [];
	const toolCount = tools.length;

	return (
		<Card className="overflow-hidden">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Server className="h-5 w-5 text-primary" />
						{server.name}
					</CardTitle>
					<Badge variant="secondary" className="gap-1">
						<Wrench className="h-3 w-3" />
						{toolCount} {toolCount === 1 ? "Tool" : "Tools"}
					</Badge>
				</div>
				{server.description && (
					<p className="text-sm text-muted-foreground ">
						{server.description}
					</p>
				)}
			</CardHeader>
			<CardContent className="">
				{toolCount === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">No tools available</p>
					</div>
				) : (
					<div className="max-h-48 overflow-y-auto pr-2">
						<Accordion type="single" collapsible className="w-full">
							{tools.map((tool, index) => (
								<AccordionItem
									key={`${tool.name}-${index}`}
									value={`tool-${index}`}
									className="border-b last:border-b-0"
								>
									<AccordionTrigger className="hover:no-underline py-2">
										<div className="flex items-center gap-2 text-left">
											<Badge
												variant="outline"
												className="font-mono text-xs"
											>
												{tool.name}
											</Badge>
										</div>
									</AccordionTrigger>
									<AccordionContent className="pb-3">
										<div className="space-y-2">
											<div className="text-sm text-muted-foreground">
												{tool.description ||
													"No description available"}
											</div>
											{tool.inputSchema && (
												<div className="mt-2 p-2 bg-muted rounded-md">
													<p className="text-xs font-semibold mb-1">
														Input Schema:
													</p>
													<pre className="text-xs overflow-x-auto">
														{JSON.stringify(
															tool.inputSchema,
															null,
															2,
														)}
													</pre>
												</div>
											)}
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
