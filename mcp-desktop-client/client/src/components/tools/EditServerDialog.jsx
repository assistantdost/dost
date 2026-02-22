import React, { useState, useEffect } from "react";
import { useMcpStore } from "../../store/mcpStore";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

export function EditServerDialog({ open, onOpenChange, serverName }) {
	const config = useMcpStore((s) => s.config);
	const updateServer = useMcpStore((s) => s.updateServer);

	const [editJson, setEditJson] = useState("");
	const [editError, setEditError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open && config?.[serverName]) {
			setEditJson(JSON.stringify(config[serverName], null, 2));
			setEditError("");
		}
	}, [open, serverName, config]);

	const handleSave = async () => {
		try {
			const parsed = JSON.parse(editJson);
			setEditError("");
			setIsSaving(true);
			await updateServer(serverName, parsed);
			onOpenChange(false);
		} catch (e) {
			setEditError("Invalid JSON: " + e.message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Pencil className="h-4 w-4" />
						Edit — {serverName}
					</DialogTitle>
					<DialogDescription>
						Modify the JSON configuration for this server.
					</DialogDescription>
				</DialogHeader>
				<Separator />
				<div className="space-y-2">
					<Textarea
						className="font-mono text-xs min-h-64 resize-y"
						value={editJson}
						onChange={(e) => {
							setEditJson(e.target.value);
							setEditError("");
						}}
						spellCheck={false}
					/>
					{editError && (
						<p className="text-xs text-destructive">{editError}</p>
					)}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
