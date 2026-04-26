"use client";

import { useEffect } from "react";
import { useAPIStore } from "@/store/apiStore";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import CreateAPIKeyForm from "./CreateAPIKeyForm";
import APIKeysList from "./APIKeysList";
import RevokeAPIKeyDialog from "./RevokeAPIKeyDialog";
import DeleteAPIKeyDialog from "./DeleteAPIKeyDialog";
import APIKeyCreatedModal from "./APIKeyCreatedModal";

export default function APIKeysSection({ initialData = [] }) {
	const {
		apiKeys,
		loading,
		getAPIKeys,
		createAPIKey,
		revokeAPIKey,
		deleteAPIKey,
	} = useAPIStore();
	const [newKeyName, setNewKeyName] = useState("");
	const [creating, setCreating] = useState(false);
	const [showKeyModal, setShowKeyModal] = useState(false);
	const [newKeyData, setNewKeyData] = useState(null);
	const [revokeDialog, setRevokeDialog] = useState({
		open: false,
		key: null,
	});
	const [deleteDialog, setDeleteDialog] = useState({
		open: false,
		key: null,
	});
	const [revoking, setRevoking] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		// If we don't have data, fetch it. Otherwise, we rely on initialData.
		// However, Zustand store might be empty on first load.
		if (apiKeys.length === 0 && initialData.length > 0) {
			useAPIStore.setState({ apiKeys: initialData });
		}
		// Still fetch in background to ensure freshness
		getAPIKeys();
	}, [getAPIKeys, initialData, apiKeys.length]);

	const handleCreateKey = async () => {
		if (!newKeyName.trim()) {
			toast.error("Please enter a name for the API key");
			return;
		}
		setCreating(true);
		try {
			const newKey = await createAPIKey(newKeyName.trim());
			setNewKeyData(newKey);
			setShowKeyModal(true);
			setNewKeyName("");
		} catch (error) {
			// Error handled in store
		} finally {
			setCreating(false);
		}
	};

	const handleRevokeKey = (key) => {
		setRevokeDialog({ open: true, key });
	};

	const handleDeleteKey = (key) => {
		setDeleteDialog({ open: true, key });
	};

	const confirmRevoke = async () => {
		setRevoking(true);
		try {
			await revokeAPIKey(revokeDialog.key.id);
			setRevokeDialog({ open: false, key: null });
		} catch (error) {
			// Error handled in store
		} finally {
			setRevoking(false);
		}
	};

	const confirmDelete = async () => {
		setDeleting(true);
		try {
			await deleteAPIKey(deleteDialog.key.id);
			setDeleteDialog({ open: false, key: null });
		} catch (error) {
			// Error handled in store
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>API Keys</CardTitle>
					<CardDescription>
						Manage your API keys for accessing DOST-MCP services
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Create new API key */}
					<CreateAPIKeyForm
						newKeyName={newKeyName}
						setNewKeyName={setNewKeyName}
						creating={creating}
						onCreate={handleCreateKey}
					/>

					{/* API keys list */}
					<APIKeysList
						apiKeys={apiKeys}
						loading={loading}
						onRevoke={handleRevokeKey}
						onDelete={handleDeleteKey}
					/>
				</CardContent>
			</Card>

			{/* API Key Created Modal */}
			<APIKeyCreatedModal
				open={showKeyModal}
				onOpenChange={setShowKeyModal}
				keyData={newKeyData}
			/>

			{/* Revoke Dialog */}
			<RevokeAPIKeyDialog
				open={revokeDialog.open}
				onOpenChange={(open) =>
					setRevokeDialog({
						open,
						key: open ? revokeDialog.key : null,
					})
				}
				keyData={revokeDialog.key}
				onConfirm={confirmRevoke}
				revoking={revoking}
			/>

			{/* Delete Dialog */}
			<DeleteAPIKeyDialog
				open={deleteDialog.open}
				onOpenChange={(open) =>
					setDeleteDialog({
						open,
						key: open ? deleteDialog.key : null,
					})
				}
				keyData={deleteDialog.key}
				onConfirm={confirmDelete}
				deleting={deleting}
			/>
		</>
	);
}
