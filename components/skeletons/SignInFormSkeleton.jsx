import { Skeleton } from "@/components/ui/skeleton";

export default function SignInFormSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {/* E-mail field */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
            </div>

            {/* Submit button */}
            <Skeleton className="mt-6 h-10 w-full" />
        </div>
    );
}
