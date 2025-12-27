import { Skeleton } from "@/components/ui/skeleton";

export default function NavbarSkeleton() {
    return (
        <nav className="p-4 flex items-center justify-between sticky top-0 bg-background z-10 border-b">
            <div className="flex items-center justify-between w-full">
                {/* Sidebar trigger button */}
                <Skeleton className="h-10 w-10 rounded-md" />

                {/* Theme toggle button */}
                <Skeleton className="h-10 w-10 rounded-md" />
            </div>
        </nav>
    );
}
