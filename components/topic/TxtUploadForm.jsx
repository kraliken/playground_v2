"use client"

import { uploadTxtToTopicAction } from "@/lib/actions/topics"
import { Button } from "../ui/button"
import { Field, FieldGroup, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import TopicSelector from "../shared/TopicSelector"
// import { embedDocumentAction } from "@/lib/actions/embeddings"

const initialState = { ok: undefined, error: "" }
// const embedInitial = { ok: undefined, error: "", embeddedCount: 0, totalTokens: 0 };

const TxtUploadForm = ({ topics }) => {

    const formRef = useRef(null)
    const [selectedTopicId, setSelectedTopicId] = useState("")
    // const [lastDocumentId, setLastDocumentId] = useState("");

    const [state, formAction, pending] = useActionState(uploadTxtToTopicAction, initialState)
    // const [embedState, embedFormAction, embedPending] = useActionState(embedDocumentAction, embedInitial);

    const hasTopics = useMemo(() => Array.isArray(topics) && topics.length > 0, [topics])

    const [embedPending, startEmbed] = useTransition();

    useEffect(() => {
        if (state.ok === undefined) {
            return;
        }

        if (state?.ok) {
            toast.success("Tartalom feltöltve.");
            // if (state.documentId) setLastDocumentId(state.documentId);
        }
        if (!state?.ok) {
            toast.error(state.error);
        }
    }, [state.ok, state.error, state.documentId])

    // const handleStartEmbedding = () => {
    //     if (!lastDocumentId) {
    //         toast.error("Nincs dokumentum azonosító (documentId).");
    //         return;
    //     }

    //     const fd = new FormData();
    //     fd.set("documentId", lastDocumentId);

    //     startEmbed(async () => {
    //         const res = await embedDocumentAction(null, fd);

    //         if (res?.ok) {
    //             toast.success(
    //                 `Embedding kész. Subchunkok: ${res.embeddedCount ?? 0}, token: ${res.totalTokens ?? 0}`
    //             );
    //         } else {
    //             toast.error(res?.error || "Embedding indítása sikertelen.");
    //         }
    //     });
    // };

    return (
        <form ref={formRef} action={formAction} className="space-y-4 h-full">
            <FieldGroup className="flex h-full flex-col">
                <TopicSelector
                    topics={topics}
                    selectedTopicId={selectedTopicId}
                    setSelectedTopicId={setSelectedTopicId}
                    hasTopics={hasTopics}
                    pending={pending}
                />

                <input type="hidden" name="topicId" value={selectedTopicId} />

                <Field>
                    <FieldLabel htmlFor="file">TXT kiválasztása</FieldLabel>
                    <Input
                        id="file"
                        name="file"
                        type="file"
                        accept=".txt,text/plain"
                        disabled={!hasTopics || pending}
                    />
                </Field>

                <div className="mt-auto flex justify-end gap-2">
                    {/* <Button type="submit" disabled={pending || embedPending || !hasTopics || !selectedTopicId}> */}
                    <Button type="submit" disabled={pending || !hasTopics || !selectedTopicId}>
                        {pending ? "Feltöltés..." : "Feltöltés"}
                    </Button>

                    {/* <Button
                        type="button"
                        variant="secondary"
                        disabled={!lastDocumentId || pending || embedPending}
                        onClick={handleStartEmbedding}
                        title={!lastDocumentId ? "Előbb tölts fel egy dokumentumot" : "Embedding indítása"}
                    >
                        {embedPending ? "Embedding..." : "Embedding indítása"}
                    </Button> */}
                </div>

            </FieldGroup>
        </form>
    )
}

export default TxtUploadForm