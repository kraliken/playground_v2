import { Suspense } from "react"
import { auth } from '@/auth'
import CreateUserCard from '@/components/form/users/CreateUserCard'
import UserListCardSkeleton from "@/components/skeletons/users/UserListCardSkeleton"
import UsersListSection from "@/components/list/users/UsersListSection"

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const UsersPage = async () => {

    // if (process.env.NODE_ENV === "development") {
    //     await sleep(2000) // 0.8s, hogy lásd a skeleton-t
    // }


    const session = await auth()

    return (
        <div className='flex flex-col gap-4 pb-4'>
            <CreateUserCard />

            <Suspense fallback={<UserListCardSkeleton />}>
                <UsersListSection currentUserId={session?.user?.id} />
            </Suspense>
        </div>
    )
}

export default UsersPage