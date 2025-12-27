import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ListRowSkeleton = () => {
    return (
        <div className="rounded-lg border bg-muted/50 p-4 flex items-start gap-12">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-3 w-56" />
            </div>

            <div className="shrink-0">
                <Skeleton className="h-10 w-10 rounded-md" />
            </div>
        </div>
    );
};

const RagTopicsListSkeleton = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-6 w-40" />
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <ListRowSkeleton />
                <ListRowSkeleton />
            </CardContent>
        </Card>
    );
};

export default RagTopicsListSkeleton;
