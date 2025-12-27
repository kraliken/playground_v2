import { Skeleton } from "@/components/ui/skeleton"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"

const UserListItemSkeleton = () => {
    return (
        <Item variant="muted" className="flex items-start gap-12">
            <ItemContent className="gap-6 w-full">
                <ItemTitle className="flex items-center gap-3 w-full">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </ItemTitle>

                <div className="mt-2 grid grid-cols-12 gap-x-6 gap-y-2 items-center w-full">
                    {/* Email */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-full" />
                    </div>

                    {/* Státusz */}
                    <div className="col-span-1 flex items-center">
                        <Skeleton className="h-5 w-14 rounded-full" />
                    </div>

                    {/* Jelszó badge helye */}
                    <div className="col-span-2 flex items-center">
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>

                    {/* Token */}
                    <div className="col-span-3 flex items-center">
                        <Skeleton className="h-5 w-36 rounded-full" />
                    </div>

                    {/* Létrehozva */}
                    <div className="col-span-2 text-right">
                        <Skeleton className="h-3 w-48 ml-auto" />
                    </div>
                </div>
            </ItemContent>

            <ItemActions className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
            </ItemActions>
        </Item>
    )
}

export default UserListItemSkeleton
