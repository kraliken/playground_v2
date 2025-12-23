import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import CreateTopicForm from "./CreateTopicForm"

const CreateTopicCard = () => {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base">Témakör létrehozása</CardTitle>
            </CardHeader>
            <CardContent className="h-full" >
                <CreateTopicForm />
            </CardContent>
        </Card>
    )
}

export default CreateTopicCard