"use client";

import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function APIKeyCreatedModal({ open, onOpenChange, keyData }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>API Key Created</DialogTitle>
					<DialogDescription>
						Your new API key has been created. Copy it now as it
						won't be shown again.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="p-3 bg-muted rounded-md">
						<p className="text-sm font-mono break-all">
							{keyData?.key}
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(
										keyData?.key,
									);
									toast.success(
										"API key copied to clipboard!",
									);
								} catch (error) {
									toast.error("Failed to copy to clipboard");
								}
							}}
							className="flex-1"
						>
							Copy to Clipboard
						</Button>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Close
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
