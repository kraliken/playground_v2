import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import UserListItemSkeleton from "./UserListItemSkeleton"

const UserListCardSkeleton = () => {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-56" />
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {Array.from({ length: 2 }).map((_, idx) => (
                    <UserListItemSkeleton key={idx} />
                ))}
            </CardContent>
        </Card>
    )
}

export default UserListCardSkeleton
