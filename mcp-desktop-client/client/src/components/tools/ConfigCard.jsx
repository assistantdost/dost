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
	Trash2,
	Server,
	CheckCircle2,
	XCircle,
	Eye,
	Pencil,
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
} from "@/components/ui/alert-dialog";
import { ViewServerDialog } from "./ViewServerDialog";
import { EditServerDialog } from "./EditServerDialog";

export const ConfigCard = React.memo(function ConfigCard({ serverName, serverConfig }) {
	const { removeServer, connectOneServer, disconnectOneServer } =
		useMcpStore();

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showViewDialog, setShowViewDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);

	const handleDelete = async () => {
		await removeServer(serverName);
		setShowDeleteDialog(false);
	};

	const isEnabled = serverConfig?.enabled !== false;

	return (
		<>
			<Card size="sm" className="group hover:shadow-md transition-all">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1 min-w-0 space-y-1">
							<CardTitle className="flex items-center gap-2 ">
								<Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
								<span className="truncate">{serverName}</span>
							</CardTitle>
							<CardDescription className=" line-clamp-2">
								{serverConfig?.description ||
									"No description provided"}
							</CardDescription>
						</div>
						<div className="ml-2">
							{isEnabled ? (
								<Badge variant="default" className="gap-1">
									<CheckCircle2 className="h-3 w-3" />
									Active
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

				<CardFooter className="flex gap-2">
					{isEnabled ? (
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => disconnectOneServer(serverName)}
						>
							Disconnect
						</Button>
					) : (
						<Button
							variant="default"
							size="sm"
							className="flex-1"
							onClick={() => connectOneServer(serverName)}
						>
							Connect
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						title="View"
						onClick={() => setShowViewDialog(true)}
					>
						<Eye className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						title="Edit"
						onClick={() => setShowEditDialog(true)}
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						title="Delete"
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

			<ViewServerDialog
				open={showViewDialog}
				onOpenChange={setShowViewDialog}
				serverName={serverName}
			/>
			<EditServerDialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				serverName={serverName}
			/>
		</>
	);
});
