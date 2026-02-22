import React from "react";
import { useMcpStore } from "../../store/mcpStore";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Server } from "lucide-react";

export function ViewServerDialog({ open, onOpenChange, serverName }) {
	const config = useMcpStore((s) => s.config);
	const serverConfig = config?.[serverName];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Server className="h-4 w-4" />
						{serverName}
					</DialogTitle>
					<DialogDescription>
						{serverConfig?.description || "No description provided"}
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<div className="space-y-2">
					<p className="text-sm font-medium text-muted-foreground">
						Raw Configuration
					</p>
					<pre className="rounded-md bg-muted p-4 text-xs overflow-auto max-h-72 font-mono whitespace-pre-wrap break-all">
						{JSON.stringify(serverConfig, null, 2)}
					</pre>
				</div>
			</DialogContent>
		</Dialog>
	);
}
