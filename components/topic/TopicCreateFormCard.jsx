
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import TopicCreateForm from './TopicCreateForm'

const TopicCreateFormCard = () => {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base">Létrehozás</CardTitle>
            </CardHeader>
            <CardContent>
                <TopicCreateForm />
            </CardContent>
        </Card>
    )
}

export default TopicCreateFormCard