import SidebarSkeleton from "./SidebarSkeleton";
import NavbarSkeleton from "./NavbarSkeleton";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardLayoutSkeleton() {

    return (
        <div className="min-h-[calc(100vh-68px)] flex items-center justify-center">
            <Skeleton className="h-10 sm:h-14 w-1/2 rounded-xl" />
        </div>
    );
}
