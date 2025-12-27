"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTopicCascadeAction } from "@/action/topic";
import { Loader2 } from "lucide-react";

const DeleteTopicDialog = ({ topicId, title, open, onOpenChange }) => {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteTopicCascadeAction(topicId);

            if (result.ok) {
                toast.success(result.message);
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent aria-busy={isPending}>
                <AlertDialogTitle>Témakör törlése</AlertDialogTitle>
                <AlertDialogDescription>
                    Biztosan szeretnéd törölni a <strong>{title}</strong> témakört? <br />
                    Ez a művelet nem vonható vissza.
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                    <AlertDialogCancel disabled={isPending}>Mégsem</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Törlés..." : "Törlés"}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteTopicDialog;
