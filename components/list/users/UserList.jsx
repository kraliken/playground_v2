

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import UserListItem from "./UserListItem";

const UserList = ({ users, currentUserId }) => {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aktív felhasználók listája</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nincsenek felhasználók</p>
                ) : (
                    users.map((user) => (
                        <UserListItem key={user.id} user={user} currentUserId={currentUserId} />
                    ))
                )}
            </CardContent>
        </Card>
    )
}

export default UserList