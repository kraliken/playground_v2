import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FieldSkeleton = ({ labelWidth = "w-24", inputHeight = "h-10" }) => {
    return (
        <div className="space-y-2 w-full">
            <Skeleton className={`h-4 ${labelWidth}`} />
            <Skeleton className={`${inputHeight} w-full rounded-md`} />
        </div>
    );
};

const RagTopicsCardsSkeleton = () => {
    return (
        <div className="flex gap-4 items-stretch">
            {/* Create topic */}
            <div className="flex-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-base">
                            <Skeleton className="h-5 w-40" />
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="h-full">
                        <div className="h-full flex flex-col items-start gap-6">
                            <FieldSkeleton labelWidth="w-24" inputHeight="h-10" />
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-24 w-full rounded-md" />
                            </div>

                            {/* gomb alul */}
                            <div className="mt-auto w-full flex justify-start">
                                <Skeleton className="h-10 w-28 rounded-md" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upload content */}
            <div className="flex-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-base">
                            <Skeleton className="h-5 w-36" />
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="h-full space-y-4">
                        <div className="h-full flex flex-col items-end gap-6">
                            {/* Topic selector */}
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-full rounded-md" />
                            </div>

                            {/* File input */}
                            <FieldSkeleton labelWidth="w-28" inputHeight="h-10" />

                            {/* gomb alul, jobbra */}
                            <div className="mt-auto w-full flex justify-end">
                                <Skeleton className="h-10 w-28 rounded-md" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RagTopicsCardsSkeleton;
