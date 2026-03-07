"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateAPIKeyForm({
	newKeyName,
	setNewKeyName,
	creating,
	onCreate,
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor="key-name">Create New API Key</Label>
			<div className="flex gap-2">
				<Input
					id="key-name"
					placeholder="Enter key name"
					value={newKeyName}
					onChange={(e) => setNewKeyName(e.target.value)}
					disabled={creating}
				/>
				<Button
					onClick={onCreate}
					disabled={creating || !newKeyName.trim()}
				>
					{creating ? "Creating..." : "Create"}
				</Button>
			</div>
		</div>
	);
}
