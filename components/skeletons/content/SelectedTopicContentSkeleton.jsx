import { Skeleton } from "@/components/ui/skeleton";

export default function SelectedTopicContentSkeleton() {

    return (
        <div className="flex flex-col gap-3">
            {/* 2 "subtopic" sor, jobb oldalon chunk számmal */}
            {Array.from({ length: 1 }).map((_, i) => (
                <div key={i} className="rounded-xl border">
                    <div className="flex flex-col items-start justify-start gap-3 px-4 py-4">
                        <Skeleton className="h-4 w-[45%]" />
                        <Skeleton className="h-3 w-[65%]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
