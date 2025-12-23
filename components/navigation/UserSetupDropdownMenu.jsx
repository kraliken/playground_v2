"use client"

import { ChevronUp, LogOut, User2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { SidebarMenuButton } from "../ui/sidebar"
import { SignOutAction } from "@/lib/actions/auth"

const UserSetupDropdownMenu = ({ session }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                    <User2 />{session?.user?.name} <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => SignOutAction()}>
                    <LogOut />
                    Kilépés
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserSetupDropdownMenu