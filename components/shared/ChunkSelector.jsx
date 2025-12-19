import { Field, FieldLabel } from "../ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"


const ChunkSelector = ({ chunks, selectedTopicId, selectedChunkId, setSelectedChunkId, hasTopics, pending }) => {
    return (
        <Field>
            <FieldLabel htmlFor="chunk">Alcím (opcionális)</FieldLabel>
            <Select value={selectedChunkId} onValueChange={setSelectedChunkId} disabled={!hasTopics || !selectedTopicId || pending}>
                <SelectTrigger>
                    <SelectValue placeholder="Válassz alcímet..." />
                </SelectTrigger>
                <SelectContent>
                    {chunks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                            {t.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    )
}

export default ChunkSelector