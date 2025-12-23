import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TopicSelector = ({ state, topics, selectedTopicId, setSelectedTopicId, hasTopics, pending }) => {
    console.log(topics);

    return (
        <Field>
            <FieldLabel htmlFor="topic">Témakör</FieldLabel>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId} disabled={!hasTopics || pending}>
                <SelectTrigger>
                    <SelectValue placeholder="Válassz témakört..." />
                </SelectTrigger>
                <SelectContent>
                    {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                            {t.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {state.errors?.topicId && (
                <FieldError>{state.errors.topicId}</FieldError>
            )}
        </Field>
    )
}

export default TopicSelector