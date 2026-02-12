import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Power, PowerOff, Settings } from "lucide-react";

export function ServerCard({
	serverName,
	serverData,
	onViewTools,
	onSettings,
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							{serverName}
							{serverData.connected ? (
								<Badge variant="default" className="gap-1">
									<Power className="h-3 w-3" />
									Connected
								</Badge>
							) : (
								<Badge variant="secondary" className="gap-1">
									<PowerOff className="h-3 w-3" />
									Disconnected
								</Badge>
							)}
						</CardTitle>
						<CardDescription>
							{serverData.metadata?.description ||
								"No description"}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-sm text-muted-foreground">
							Tools:
						</span>
						<Badge variant="outline">
							{serverData.toolsCount || 0}
						</Badge>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm text-muted-foreground">
							Transport:
						</span>
						<Badge variant="outline">
							{serverData.metadata?.transport || "N/A"}
						</Badge>
					</div>
					{serverData.metadata?.url && (
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">
								URL:
							</span>
							<span className="text-xs text-muted-foreground truncate max-w-50">
								{serverData.metadata.url}
							</span>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={() => onViewTools(serverName, serverData)}
				>
					View Tools
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={() => onSettings(serverName, serverData)}
				>
					<Settings className="h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	);
}
