import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const CreateUserCardSkeleton = () => {
    return (
        <Card>
            <CardContent>
                <div className="flex flex-col items-start gap-6">
                    <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <Skeleton className="h-10 w-56" />
                </div>
            </CardContent>
        </Card>
    )
}

export default CreateUserCardSkeleton
