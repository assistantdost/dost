import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";

export function ViewToolsDialog({
	open,
	onOpenChange,
	serverName,
	serverData,
}) {
	const tools = serverData?.tools || [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{serverName} - Tools</DialogTitle>
					<DialogDescription>
						{tools.length} {tools.length === 1 ? "tool" : "tools"}{" "}
						available from this server
					</DialogDescription>
				</DialogHeader>
				<div className="max-h-96 overflow-y-auto">
					{tools.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No tools available
						</div>
					) : (
						<div className="space-y-2 p-4">
							{tools.map((tool) => (
								<div
									key={tool}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<code className="text-sm">{tool}</code>
									<Badge variant="outline">Available</Badge>
								</div>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
