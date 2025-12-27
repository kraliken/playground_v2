import { Field, FieldLabel } from '../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const TopicSelector = ({
    topics,
    selectedTopicId,
    setSelectedTopicId,
    hasTopics
}) => {

    return (
        <Field>
            <FieldLabel htmlFor="topic">Témakör</FieldLabel>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId} disabled={!hasTopics()}>
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
        </Field>
    )
}

export default TopicSelector