import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import SignInFormSkeleton from "@/components/skeletons/SignInFormSkeleton";
import OAuthButtonSkeleton from "@/components/skeletons/OAuthButtonSkeleton";

export default function AuthPageSkeleton() {
    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
            <Card className="w-full max-w-xl">
                <CardHeader className="space-y-3 text-center">
                    <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        <Skeleton className="mx-auto h-9 w-64 sm:h-10 sm:w-80" />
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-10">
                    <SignInFormSkeleton />

                    <div className="flex items-center gap-3">
                        <Separator className="flex-1" />
                        <Skeleton className="h-3 w-24" />
                        <Separator className="flex-1" />
                    </div>

                    <OAuthButtonSkeleton />

                    <div className="flex justify-center">
                        <Skeleton className="h-3 w-72" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
