import { getUsers } from '@/action/user'
import { auth } from '@/auth'
import CreateUserCard from '@/components/form/users/CreateUserCard'
import UserList from '@/components/list/users/UserList'


const UsersPage = async () => {

    const session = await auth()
    const { data } = await getUsers()

    return (
        <div className='flex flex-col gap-4 pb-4'>
            <CreateUserCard />
            <UserList users={data} currentUserId={session?.user?.id} />
        </div>
    )
}

export default UsersPage