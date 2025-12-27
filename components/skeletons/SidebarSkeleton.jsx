import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarSkeleton() {
    return (
        <aside className="hidden md:flex w-64 lg:w-72 border-r bg-background/50">
            <div className="w-full flex flex-col">
                {/* Header */}
                <div className="py-4 px-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>

                <div className="border-t" />

                {/* Content groups */}
                <div className="px-3 py-4 space-y-6">
                    {/* Group title */}
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-44" />
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-7 w-7 rounded-md" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optional second group (admin section placeholder) */}
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <div className="space-y-2">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-7 w-7 rounded-md" />
                                    <Skeleton className="h-4 w-28" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer user dropdown button placeholder */}
                <div className="mt-auto px-3 py-4 border-t">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 ml-auto rounded" />
                    </div>
                </div>
            </div>
        </aside>
    );
}
