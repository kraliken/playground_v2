import { Skeleton } from "@/components/ui/skeleton";

export default function OAuthButtonSkeleton() {
    return (
        <div className="w-full">
            <Skeleton className="h-10 w-full" />
        </div>
    );
}
