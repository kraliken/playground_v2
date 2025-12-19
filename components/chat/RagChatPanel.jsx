"use client"

import { Loader2, RotateCcw, Send } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Separator } from "../ui/separator"
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Textarea } from "../ui/textarea"
import TopicSelector from "../shared/TopicSelector"
import { getChunksByTopicId } from "@/lib/actions/chunk"
import ChunkSelector from "../shared/ChunkSelector"
import ChatBubble from "./ChatBubble"
import { askRagAction } from "@/lib/actions/chat"
import { useRouter } from "next/navigation"

const initialState = {
    ok: false,
    error: "",
    question: "",
    answer: "",
    citations: [],
    topic: null,
    debug: null,
    responseId: null,
}

const RagChatPanel = ({ topics }) => {

    const router = useRouter()

    const [state, formAction, pending] = useActionState(askRagAction, initialState)

    const [isPending, startTransition] = useTransition();

    const [chunks, setChunks] = useState([]);

    const formRef = useRef(null)
    const scrollRef = useRef(null)
    const lastHandledResponseId = useRef(null)

    const [messages, setMessages] = useState([])
    const [question, setQuestion] = useState("")

    const [selectedTopicId, setSelectedTopicId] = useState("")
    const [selectedChunkId, setSelectedChunkId] = useState("");

    const hasTopics = useMemo(() => Array.isArray(topics) && topics.length > 0, [topics])

    function scrollToBottom() {
        const el = scrollRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }
    // Topic választás -> chunkok betöltése
    useEffect(() => {
        if (!selectedTopicId) {
            setChunks([]);
            setSelectedChunkId("");
            return;
        }

        startTransition(async () => {
            const { chunks } = await getChunksByTopicId(selectedTopicId);
            setChunks(chunks);
            setSelectedChunkId("");
        });
    }, [selectedTopicId]);

    useEffect(() => {
        if (!state?.responseId) return
        if (lastHandledResponseId.current === state.responseId) return
        lastHandledResponseId.current = state.responseId

        if (!state?.ok) return

        setMessages((prev) => {
            const next = [...prev]
            if (state.question) next.push({ role: "user", text: state.question })
            next.push({ role: "assistant", text: state.answer, citations: state.citations || [] })
            return next
        })

        setQuestion("")
        formRef.current?.reset()
        router.refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state?.responseId])

    useEffect(() => {
        scrollToBottom()
    }, [messages.length])

    const chatHistoryJson = useMemo(() => {
        const last = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
        return JSON.stringify(last)
    }, [messages])



    function handleNewChat() {
        setMessages([])
        setQuestion("")
        formRef.current?.reset()
        lastHandledResponseId.current = null // ✅ fontos
        setTimeout(scrollToBottom, 0)
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">

            {/* LEFT SIDE - KOMPONENS */}
            <Card className="p-4 space-y-4 h-fit">
                <TopicSelector
                    topics={topics}
                    selectedTopicId={selectedTopicId}
                    setSelectedTopicId={setSelectedTopicId}
                    hasTopics={hasTopics}
                    pending={pending}
                />
                <Separator />
                <ChunkSelector
                    chunks={chunks}
                    selectedTopicId={selectedTopicId}
                    selectedChunkId={selectedChunkId}
                    setSelectedChunkId={setSelectedChunkId}
                    hasTopics={hasTopics}
                    pending={pending}

                />
                <Separator />
                <Button type="button" onClick={handleNewChat} disabled={pending}>
                    <RotateCcw className="h-4 w-4" />
                    Új beszélgetés indítása
                </Button>
            </Card>

            {/* RIGHT SIDE - KOMPONENS */}

            <Card className="space-y-4 pb-0">

                {/* CHAT WINDOW */}
                <div
                    ref={scrollRef}
                    className="space-y-3 rounded-md bg-muted/5 px-4 overflow-y-auto"
                    style={{ maxHeight: "64vh", minHeight: "64vh" }}
                >
                    {!messages.length ? (
                        <div className="border rounded-xl bg-muted/10 p-4 text-sm text-muted-foreground">
                            Még nincs üzenet. Válassz témakört (és opcionálisan alcímet), majd tegyél fel kérdést.
                        </div>
                    ) : (
                        messages.map((m, idx) => (
                            <div key={idx} className="space-y-2">
                                <ChatBubble role={m.role}>{m.text}</ChatBubble>
                                {/* {m.role === "assistant" ? <CitationsList citations={m.citations || []} /> : null} */}
                            </div>
                        ))
                    )}

                </div>

                {/* CHAT INPUT FORM */}
                <Card className="border-none px-4">

                    <form ref={formRef} action={formAction} className="flex justify-between items-end gap-4">

                        {/* HIDDEN INPUTS */}
                        <input type="hidden" name="topicId" value={selectedTopicId} />
                        <input type="hidden" name="topK" value="6" />
                        {/* <input type="hidden" name="maxContextChars" value="9000" /> */}

                        <input type="hidden" name="maxUiCitations" value="2" />
                        <input type="hidden" name="uiScoreDelta" value="0.03" />
                        <input type="hidden" name="uiMinScore" value="0.0" />

                        <input type="hidden" name="chunkId" value={selectedChunkId} />
                        <input type="hidden" name="chatHistoryJson" value={chatHistoryJson} />

                        {/* <Label htmlFor="question">Kérdés</Label> */}

                        <Textarea
                            id="question"
                            name="question"
                            // className="rounded-xl min-h-22.5"
                            placeholder="Írd be a kérdésed…"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={pending}
                            required
                        />
                        <div className="flex justify-end">
                            <Button type="submit" variant="" size="icon" disabled={pending || !selectedTopicId}>
                                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </div>

                    </form>
                </Card>


            </Card>

        </div >

    )
}

export default RagChatPanel