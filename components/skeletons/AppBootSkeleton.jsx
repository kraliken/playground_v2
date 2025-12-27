import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="min-h-dvh bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-4">
                    {/* Soft spinner */}
                    <div
                        className="h-10 w-10 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin"
                        aria-hidden="true"
                    />

                    {/* Neutral skeleton content */}
                    {/* <div className="w-full space-y-3" aria-label="Betöltés folyamatban" aria-busy="true">
                        <Skeleton className="h-5 w-40 mx-auto" />
                        <Skeleton className="h-4 w-56 mx-auto" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                    </div> */}
                </div>
            </div>
        </div>
    )
}
