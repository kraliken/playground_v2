import { getUsers } from "@/action/user"
import UserList from "./UserList"

const UsersListSection = async ({ currentUserId }) => {
    const { data } = await getUsers()
    return <UserList users={data} currentUserId={currentUserId} />
}

export default UsersListSection
