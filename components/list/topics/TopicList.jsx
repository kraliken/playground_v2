import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TopicListItem from "./TopicListItem"


const TopicList = ({ topics }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Témakörök listája</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {topics.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nincsenek támakörök</p>
                ) : (
                    topics.map((topic) => (
                        <TopicListItem key={topic.id} topic={topic} />
                    ))
                )}
            </CardContent>
        </Card>
    )
}

export default TopicList