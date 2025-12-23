import { Field, FieldLabel } from '../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const SubTopicSelector = ({
    subTopics,
    selectedSubTopicId,
    setSelectedSubTopicId,
    hasSubTopics,
    selectedTopicId
}) => {

    return (
        <Field>
            <FieldLabel htmlFor="topic">Altémakör</FieldLabel>
            <Select value={selectedSubTopicId} onValueChange={setSelectedSubTopicId} disabled={!hasSubTopics || !selectedTopicId}>
                <SelectTrigger>
                    <SelectValue placeholder="Válassz altémakört..." />
                </SelectTrigger>
                <SelectContent>
                    {subTopics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                            {t.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    )
}

export default SubTopicSelector