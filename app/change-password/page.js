// app/change-password/page.jsx
"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { changePassword } from "@/action/change-password";
import { LogOut } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

const initialState = {
    ok: true,
    message: "",
};

export default function ChangePasswordPage() {
    const [state, formAction, isPending] = useActionState(
        changePassword,
        initialState
    );

    // Ha a server action hibát adott vissza → toast (opcionális)
    useEffect(() => {
        if (state && !state.ok && state.message) {
            toast("Hiba történt", {
                variant: "destructive",
                description: state.message,
            });
        }
    }, [state]);

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Jelszó megváltoztatása
                    </CardTitle>
                    <CardDescription className="text-center">
                        Biztonsági okokból kérjük, állíts be egy új jelszót.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Jelenlegi jelszó</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Új jelszó</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPasswordConfirm">Új jelszó megerősítése</Label>
                            <Input
                                id="newPasswordConfirm"
                                name="newPasswordConfirm"
                                type="password"
                                autoComplete="new-password"
                            />
                        </div>

                        {state && !state.ok && state.message && (
                            <p className="text-sm text-destructive mt-1">
                                {state.message}
                            </p>
                        )}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Mentés..." : "Jelszó módosítása"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex gap-2">
                    <SignOutButton />
                </CardFooter>
            </Card>
        </div>
    );
}
