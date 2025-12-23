import {
    Card,
    CardContent,
} from "@/components/ui/card"
import CreateUserForm from "./CreateUserForm"

const CreateUserCard = () => {
    return (
        <Card>
            <CardContent>
                <CreateUserForm />
            </CardContent>
        </Card>
    )
}

export default CreateUserCard