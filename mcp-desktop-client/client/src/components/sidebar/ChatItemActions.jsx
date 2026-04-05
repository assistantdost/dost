import React, { useState } from "react";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatMutationOptions } from "@/lib/tanstackQueries";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

export function ChatItemActions({ chat, onDelete }) {
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [newName, setNewName] = useState(chat.name);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const location = useLocation();

	// Rename mutation
	const renameMutation = useMutation(
		chatMutationOptions.rename(queryClient, chat.id, {
			onSuccess: () => {
				toast.success("Chat renamed successfully");
				setIsRenameOpen(false);
			},
			onError: (error) => {
				toast.error("Failed to rename chat");
				console.error(error);
			},
		}),
	);

	// Delete mutation
	const deleteMutation = useMutation(
		chatMutationOptions.delete(queryClient, chat.id, {
			onSuccess: () => {
				toast.success("Chat deleted successfully");
				setIsDeleteOpen(false);
				// Navigate away if currently viewing this chat
				if (location.pathname === `/chat/${chat.id}`) {
					navigate("/", { replace: true });
				}
			},
			onError: (error) => {
				toast.error("Failed to delete chat");
				console.error(error);
			},
		}),
	);

	const handleRename = () => {
		if (newName.trim() && newName !== chat.name) {
			renameMutation.mutate(newName.trim());
		} else {
			setIsRenameOpen(false);
		}
	};

	const handleDelete = () => {
		deleteMutation.mutate();
	};

	return (
		<>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer"
					>
						<MoreHorizontal className="h-3 w-3" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="max-w-40 p-1" align="end">
					<div className="space-y-0">
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start"
							onClick={() => setIsRenameOpen(true)}
						>
							<Edit className="mr-2 h-3 w-3" />
							Rename
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="w-full justify-start text-destructive hover:text-destructive"
							onClick={() => setIsDeleteOpen(true)}
						>
							<Trash2 className="mr-2 h-3 w-3" />
							Delete
						</Button>
					</div>
				</PopoverContent>
			</Popover>

			{/* Rename Dialog */}
			<Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename Chat</DialogTitle>
						<DialogDescription>
							Enter a new name for this chat.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Chat name"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleRename();
								if (e.key === "Escape") setIsRenameOpen(false);
							}}
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsRenameOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleRename}
							disabled={
								renameMutation.isPending || !newName.trim()
							}
						>
							{renameMutation.isPending
								? "Renaming..."
								: "Rename"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Chat</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{chat.name}"? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending
								? "Deleting..."
								: "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
