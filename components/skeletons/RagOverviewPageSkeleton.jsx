import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function PillSkeleton() {
    return <Skeleton className="h-6 w-40 rounded-full" />;
}

function BadgeSkeleton() {
    return <Skeleton className="h-6 w-44 rounded-md" />;
}

function HeaderSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <BadgeSkeleton />
                <PillSkeleton />
                <Skeleton className="h-6 w-56 rounded-full" />
            </div>

            <Skeleton className="h-7 w-[min(560px,100%)]" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[min(760px,100%)]" />
                <Skeleton className="h-4 w-[min(720px,100%)]" />
            </div>
        </div>
    );
}

function DiagramCardSkeleton() {
    return (
        <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5 w-28" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="mt-2 h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-hidden rounded-xl border bg-background">
                    {/* A page-ben: relative h-130 w-full lg:h-160 */}
                    <div className="relative h-130 w-full lg:h-160">
                        <Skeleton className="absolute inset-0" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LeftAlertSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5 w-56" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[78%]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[88%]" />
                    <Skeleton className="h-4 w-[72%]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[84%]" />
                    <Skeleton className="h-4 w-[70%]" />
                </div>
            </CardContent>
        </Card>
    );
}

function StepsCardSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5 w-52" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="mt-2 h-4 w-56" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="mt-0.5 h-6 w-6 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-[70%]" />
                            <Skeleton className="h-4 w-[92%]" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function PillarCardSkeleton({ titleWidth = 120, descWidth = 220 }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5" style={{ width: titleWidth }} />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="mt-2 h-4" style={{ width: descWidth }} />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-[78%]" />
                        <Skeleton className="h-4 w-[92%]" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function PrinciplesSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5 w-56" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="mt-2 h-4 w-[min(360px,100%)]" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-[90%]" />
                        <Skeleton className="h-4 w-[78%]" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function FaqSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-5 w-20" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="mt-2 h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[70%]" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function RagOverviewPageSkeleton() {
    return (
        <main className="mx-auto w-full max-w-6xl p-6">
            <HeaderSkeleton />

            <Separator className="my-6" />

            <div className="grid gap-6 lg:grid-cols-2">
                <DiagramCardSkeleton />

                {/* Alatta a két kártya: a page-ben flex + gap-6 */}
                <div className="lg:col-span-2 flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1">
                        <LeftAlertSkeleton />
                    </div>
                    <div className="flex-1">
                        <StepsCardSkeleton />
                    </div>
                </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 lg:grid-cols-3">
                <PillarCardSkeleton titleWidth={140} descWidth={300} />
                <PillarCardSkeleton titleWidth={150} descWidth={260} />
                <PillarCardSkeleton titleWidth={130} descWidth={260} />
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 lg:grid-cols-2">
                <PrinciplesSkeleton />
                <FaqSkeleton />
            </div>
        </main>
    );
}
