import SidebarSkeleton from "./SidebarSkeleton";
import NavbarSkeleton from "./NavbarSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayoutSkeleton() {
    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Sidebar (desktop) */}
            <SidebarSkeleton />

            {/* Main */}
            <div className="flex-1 min-w-0">
                <NavbarSkeleton />

                <main className="px-4">
                    <div className="min-h-[calc(100vh-68px)] flex items-center justify-center">
                        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
                            {/* Title row (icon + text) */}
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-8 w-60 sm:h-12 sm:w-96" />
                                    <Skeleton className="h-4 w-40 sm:w-56" />
                                </div>
                            </div>

                            {/* A tiny “content hint” block */}
                            <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-16 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
