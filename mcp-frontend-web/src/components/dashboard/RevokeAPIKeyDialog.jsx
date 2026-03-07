"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RevokeAPIKeyDialog({
	open,
	onOpenChange,
	keyData,
	onConfirm,
	revoking,
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Revoke API Key</DialogTitle>
					<DialogDescription>
						Are you sure you want to revoke the API key "
						{keyData?.name}"? This will disable the key, but you can
						create a new one if needed.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={revoking}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={revoking}
					>
						{revoking ? "Revoking..." : "Revoke"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
