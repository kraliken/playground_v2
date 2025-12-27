import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function BubbleSkeleton({ }) {
    return (
        <div className="flex-1">
            <div className="w-full">
                <div className="w-full rounded-xl border px-4 py-4 bg-muted/10 space-y-2">
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </div>
    );
}

export default function RagChatRightPanelSkeleton() {
    return (
        <Card className="h-full flex flex-col min-h-0 overflow-hidden">
            {/* CHAT WINDOW */}
            <div className="w-full flex-1 min-h-0 space-y-3 bg-muted/5 overflow-y-hidden px-4 py-4">
                <BubbleSkeleton />
            </div>

            {/* INPUT AREA */}
            <div className="py-2 px-4">
                <div className="w-full flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-24 w-full rounded-md" />
                        <div className="flex flex-wrap gap-x-3 gap-y-2">
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-3 w-60" />
                            <Skeleton className="h-3 w-52" />
                        </div>
                    </div>

                    <Skeleton className="h-10 w-10 rounded-md" />
                </div>
            </div>
        </Card>
    );
}
