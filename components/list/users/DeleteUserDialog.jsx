"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteUser } from "@/action/user"

const DeleteUserDialog = ({ userId, userName, open, onOpenChange }) => {

    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteUser(userId)

            if (result.ok) {
                toast.success(result.message)
                onOpenChange(false)

            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent aria-busy={isPending}>
                <AlertDialogTitle>Felhasználó inaktiválása</AlertDialogTitle>
                <AlertDialogDescription>
                    Biztosan szeretnéd inaktiválni a <strong>{userName}</strong> nevű felhasználót? <br />Ez a művelet nem vonható vissza.
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                    <AlertDialogCancel disabled={isPending}>Mégsem</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {isPending ? "Inaktiválás..." : "Inaktiválás"}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteUserDialog