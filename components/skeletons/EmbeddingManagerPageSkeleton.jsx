import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TopicCardSkeleton({ items = 2 }) {
    return (
        <Card className="h-full">
            <CardHeader className="space-y-3">
                {/* cím */}
                <Skeleton className="h-5 w-64" />

                {/* badge sor (pl. "1 altéma") */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {Array.from({ length: items }).map((_, idx) => (
                    <div
                        key={idx}
                        className="flex items-start justify-between gap-12 rounded-xl border border-border/60 bg-muted/30 p-4"
                    >
                        <div className="min-w-0 flex-1">
                            {/* altéma cím */}
                            <Skeleton className="h-4 w-72 max-w-full" />

                            {/* badge sor a list item alatt */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-5 w-28 rounded-full" />
                            </div>
                        </div>

                        {/* jobb oldali gomb */}
                        <div className="shrink-0">
                            <Skeleton className="h-9 w-28 rounded-md" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function EmbeddingManagerPageSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {/* A screenshot alapján kb. 2-3 kártya látszik egyszerre */}
            <TopicCardSkeleton items={1} />
            <TopicCardSkeleton items={1} />
        </div>
    );
}
