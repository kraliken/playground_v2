import CreateUserCardSkeleton from "./CreateUserCardSkeleton"
import UserListCardSkeleton from "./UserListCardSkeleton"

const UsersPageSkeleton = () => {
    return (
        <div className="flex flex-col gap-4 pb-4">
            <CreateUserCardSkeleton />
            <UserListCardSkeleton />
        </div>
    )
}

export default UsersPageSkeleton
