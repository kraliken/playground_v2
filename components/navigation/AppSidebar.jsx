

import Link from "next/link"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "../ui/sidebar"
import { Code } from "lucide-react"
import { docIntLinks, ragAppLinks, setupLinks, } from "@/lib/constans";
import UserSetupDropdownMenu from "./UserSetupDropdownMenu";


const AppSidebar = ({ session }) => {

    const role = session?.user?.role || "user";

    const filteredRagAppLinks = ragAppLinks.filter((item) =>
        item.roles?.includes(role)
    );
    const filteredLinks = setupLinks.filter((item) =>
        item.roles?.includes(role)
    );

    return (
        <Sidebar collapsible="icon">

            <SidebarHeader className="py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/dashboard">
                                <Code />
                                <span>Playground</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="m-0" />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Retrieval Augmented Generation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredRagAppLinks.map(task => (
                                <SidebarMenuItem key={task.label}>
                                    <SidebarMenuButton asChild>
                                        <Link href={task.href}>
                                            {task.icon}
                                            {task.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* <SidebarGroup>
                    <SidebarGroupLabel>
                        Document Intelligence
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {docIntLinks.map(task => (
                                <SidebarMenuItem key={task.label}>
                                    <SidebarMenuButton asChild>
                                        <Link href={task.href}>
                                            {task.icon}
                                            {task.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup> */}

                {role === 'admin' && <SidebarGroup>
                    <SidebarGroupLabel>
                        Admin
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredLinks.map(task => (
                                <SidebarMenuItem key={task.label}>
                                    <SidebarMenuButton asChild>
                                        <Link href={task.href}>
                                            {task.icon}
                                            {task.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>}

            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>

                        {/* <ClientOnly fallback={null}> */}
                        <UserSetupDropdownMenu session={session} />
                        {/* <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton>
                                        <User2 />{session?.user?.name} <ChevronUp className="ml-auto" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => SignOutAction()}>
                                        <LogOut />
                                        Kilépés
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu> */}
                        {/* </ClientOnly> */}

                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

        </Sidebar >
    )
}

export default AppSidebar