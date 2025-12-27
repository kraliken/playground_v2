"use client"

import { ChevronUp, Loader2, LogOut, User2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { SidebarMenuButton } from "../ui/sidebar"
import { SignOutAction } from "@/lib/actions/auth"
import { useTransition } from "react";

const UserSetupDropdownMenu = ({ session }) => {

    const [isPending, startTransition] = useTransition();

    const onSignOut = () => {
        startTransition(async () => {
            await SignOutAction();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                    <User2 />{session?.user?.name} <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {/* <DropdownMenuItem onSelect={() => SignOutAction()}>
                    <LogOut />
                    Kilépés
                </DropdownMenuItem> */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault(); // ne zárjon/triggereljen furán a menü
                        if (isPending) return;
                        onSignOut();
                    }}
                    disabled={isPending}
                    className="gap-2"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    {isPending ? "Kilépés..." : "Kilépés"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserSetupDropdownMenu