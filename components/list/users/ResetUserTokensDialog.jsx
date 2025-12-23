"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { resetUserTokens } from "@/action/user"

const ResetUserTokensDialog = ({ userId, userName, open, onOpenChange }) => {
    const [isPending, startTransition] = useTransition()

    const handleReset = () => {
        startTransition(async () => {
            const result = await resetUserTokens(userId)

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
            <AlertDialogContent>
                <AlertDialogTitle>Tokenek nullázása</AlertDialogTitle>
                <AlertDialogDescription>
                    Biztosan nullázod a <strong>{userName}</strong> felhasználó elhasznált tokenjeit? <br />
                    Ez a felhasználónál a <strong>tokensUsed = 0</strong> beállítást jelenti.
                </AlertDialogDescription>

                <div className="flex gap-3 justify-end">
                    <AlertDialogCancel disabled={isPending}>Mégsem</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} disabled={isPending}>
                        {isPending ? "Nullázás..." : "Nullázás"}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default ResetUserTokensDialog
