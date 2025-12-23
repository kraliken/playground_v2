import { auth } from '@/auth'
import ClientOnly from '@/components/ClientOnly'
import AppSidebar from '@/components/navigation/AppSidebar'
import Navbar from '@/components/navigation/Navbar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { cookies } from "next/headers"

const DashboardLayout = async ({ children }) => {

    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

    const session = await auth();

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar session={session} />
            <div className="w-full min-h-full">
                <Navbar />
                <main className="px-4">
                    {children}
                </main>
            </div>

        </SidebarProvider>
    )
}

export default DashboardLayout