// Example component showing connected MCP servers

import React from "react";
import { useMcpStore } from "@/store/mcpStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

export default function McpToolsExample() {
	const { mcpServers } = useMcpStore();

	return (
		<div className=" max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">MCP Servers</h1>

			{/* Connected Servers */}
			<div className="grid grid-cols-1 md:grid-cols-2  gap-4">
				{mcpServers && mcpServers.length > 0 ? (
					mcpServers.map((server) => (
						<Card key={server.name}>
							<CardHeader>
								<CardTitle className="text-lg">
									{server.name}
								</CardTitle>
							</CardHeader>

							<CardContent>
								<div className="space-y-2">
									<h4 className="font-semibold">Tools:</h4>
									{server.tools && server.tools.length > 0 ? (
										<div className="max-h-64 overflow-y-auto ">
											<Accordion
												type="single"
												collapsible
											>
												{server.tools.map((tool) => (
													<AccordionItem
														key={tool.name}
														value={tool.name}
													>
														<AccordionTrigger>
															{tool.name}
														</AccordionTrigger>
														<AccordionContent>
															{tool.description ||
																"No description"}
														</AccordionContent>
													</AccordionItem>
												))}
											</Accordion>
										</div>
									) : (
										<p className="text-sm text-muted-foreground">
											No tools available
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<div className="col-span-full text-center py-8">
						<p className="text-muted-foreground">
							No servers configured yet.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
