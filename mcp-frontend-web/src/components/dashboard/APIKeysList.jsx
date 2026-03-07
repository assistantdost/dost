"use client";

import { Button } from "@/components/ui/button";

export default function APIKeysList({ apiKeys, loading, onRevoke, onDelete }) {
	return (
		<div className="space-y-2">
			<h4 className="text-sm font-medium">Your API Keys</h4>
			{loading && apiKeys.length === 0 ? (
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : apiKeys.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No API keys found.
				</p>
			) : (
				<div className="space-y-2">
					{apiKeys.map((key) => (
						<div
							key={key.id}
							className="flex items-center justify-between p-3 border rounded-lg"
						>
							<div className="space-y-1">
								<p className="font-medium">{key.name}</p>
								<p className="text-xs text-muted-foreground">
									Created:{" "}
									{new Date(
										key.created_at,
									).toLocaleDateString()}
									{key.last_used && (
										<span>
											{" "}
											• Last used:{" "}
											{new Date(
												key.last_used,
											).toLocaleDateString()}
										</span>
									)}
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onRevoke(key)}
								>
									Revoke
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => onDelete(key)}
								>
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
