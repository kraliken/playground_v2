import { Field, FieldLabel } from "../ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"


const ChunkSelector = ({
    chunks,
    selectedChunkId,
    setSelectedChunkId,
    hasChunks,
}) => {

    return (
        <Field>
            <FieldLabel htmlFor="chunk">Fejezet (opcionális)</FieldLabel>
            <Select value={selectedChunkId} onValueChange={setSelectedChunkId} disabled={!hasChunks}>
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