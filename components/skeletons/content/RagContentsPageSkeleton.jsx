import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SelectedTopicContentSkeleton from "./SelectedTopicContentSkeleton";

export default function RagContentsPageSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {/* 1) Témakör kiválasztó kártya */}
            <Card>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" /> {/* "Témakör" label */}
                        <Skeleton className="h-10 w-full" /> {/* select */}
                    </div>
                </CardContent>
            </Card>

            {/* 2) Tartalom kártya */}
            <Card>
                <CardContent className="flex flex-col gap-6">
                    <SelectedTopicContentSkeleton />
                </CardContent>
            </Card>
        </div>
    );
}
