import React, { useState } from "react";
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
import {
	Settings,
	Trash2,
	Server,
	Link as LinkIcon,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { useMcpStore } from "../../store/mcpStore";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";

export function ConfigCard({ serverName, serverConfig, isConnected }) {
	const { removeServer, connectOneServer, disconnectOneServer } =
		useMcpStore();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isToggling, setIsToggling] = useState(false);

	const handleDelete = async () => {
		await removeServer(serverName);
		setShowDeleteDialog(false);
	};

	const handleToggleConnection = async () => {
		setIsToggling(true);
		if (isConnected) {
			await disconnectOneServer(serverName);
		} else {
			await connectOneServer(serverName);
		}
		setIsToggling(false);
	};

	const isEnabled = serverConfig?.enabled !== false;

	return (
		<>
			<Card className="group hover:shadow-md transition-all">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1 min-w-0">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
								<span className="truncate">{serverName}</span>
							</CardTitle>
							<CardDescription className="mt-1 line-clamp-2">
								{serverConfig?.description ||
									"No description provided"}
							</CardDescription>
						</div>
						<div className="ml-2">
							{isConnected ? (
								<Badge variant="default" className="gap-1">
									<CheckCircle2 className="h-3 w-3" />
									Active
								</Badge>
							) : isEnabled ? (
								<Badge variant="secondary" className="gap-1">
									<XCircle className="h-3 w-3" />
									Ready
								</Badge>
							) : (
								<Badge variant="outline" className="gap-1">
									<XCircle className="h-3 w-3" />
									Disabled
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-2 pb-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Transport</span>
						<Badge variant="outline" className="font-mono">
							{serverConfig?.transport || "N/A"}
						</Badge>
					</div>
					{serverConfig?.url && (
						<div className="flex items-center gap-2 text-sm">
							<LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
							<span className="text-muted-foreground truncate text-xs">
								{serverConfig.url}
							</span>
						</div>
					)}
					{serverConfig?.command && (
						<div className="flex items-center gap-2 text-sm">
							<span className="text-muted-foreground">
								Command:
							</span>
							<code className="text-xs bg-muted px-2 py-0.5 rounded truncate">
								{serverConfig.command}
							</code>
						</div>
					)}
				</CardContent>
				<CardFooter className="pt-3 flex gap-2">
					{isEnabled && (
						<Button
							variant={isConnected ? "outline" : "default"}
							size="sm"
							className="flex-1"
							onClick={handleToggleConnection}
							disabled={isToggling}
						>
							{isToggling
								? "Processing..."
								: isConnected
									? "Disconnect"
									: "Connect"}
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						className="opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</CardFooter>
			</Card>

			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete Server Configuration
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{serverName}"? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
