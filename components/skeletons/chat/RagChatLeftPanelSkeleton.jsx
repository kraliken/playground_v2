import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function SelectFieldSkeleton({ labelWidth = "w-24" }) {
    return (
        <div className="space-y-2">
            <Skeleton className={`h-4 ${labelWidth}`} />
            <Skeleton className="h-10 w-full rounded-md" />
        </div>
    );
}

export default function RagChatLeftPanelSkeleton() {
    return (
        <Card className="p-4 space-y-2 flex flex-col">
            {/* Témakör */}
            <SelectFieldSkeleton labelWidth="w-20" />

            <Separator />

            {/* Altémakör */}
            <SelectFieldSkeleton labelWidth="w-24" />

            <Separator />

            {/* Fejezet (opcionális) */}
            <SelectFieldSkeleton labelWidth="w-40" />

            {/* Új chat gomb alul */}
            <div className="mt-auto">
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        </Card>
    );
}
