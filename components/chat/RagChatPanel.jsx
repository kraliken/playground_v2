"use client"

import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, RotateCcw, Send } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Separator } from "../ui/separator"
import { Item, ItemActions, ItemContent, ItemFooter } from "../ui/item"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { Skeleton } from "../ui/skeleton"

import TopicSelector from "../shared/TopicSelector"
import ChunkSelector from "../shared/ChunkSelector"
import SubTopicSelector from "../shared/SubTopicSelector"
import ChatBubble from "./ChatBubble"

import { askRagAction, getChunksByIdsAction } from "@/action/chat"

// Kezdeti state a useActionState-hez
const initialState = {
    ok: false,
    error: "",
    question: "",
    answer: "",
    citations: [],
    topic: null,
    debug: null,
    responseId: null,
    usage: null,
    token: null,
}

function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="w-full sm:w-auto sm:max-w-[70%]">
                <div className="rounded-2xl border px-4 py-3 bg-muted/10">
                    <div className="flex items-center gap-1.5 h-5">
                        <span
                            className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-typing-dot"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-typing-dot"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-typing-dot"
                            style={{ animationDelay: "300ms" }}
                        />

                    </div>
                </div>
            </div>
        </div>
    )
}


const RagChatPanel = ({ topics, subTopics, chunks, initialToken }) => {

    const [state, formAction, pending] = useActionState(askRagAction, initialState)

    const [selectedTopicId, setSelectedTopicId] = useState("")
    const [selectedSubTopicId, setSelectedSubTopicId] = useState("")
    const [selectedChunkId, setSelectedChunkId] = useState("")

    const scrollRef = useRef(null)
    const formRef = useRef(null)
    const lastHandledResponseId = useRef(null)
    const [messages, setMessages] = useState([])
    const [question, setQuestion] = useState("")

    const [tokenInfo, setTokenInfo] = useState(initialToken ?? null);

    const chunkCacheRef = useRef(new Map())
    const bottomRef = useRef(null)

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }

    const [sourcesOpen, setSourcesOpen] = useState(false)
    const [sourcesLoading, setSourcesLoading] = useState(false)
    const [activeCitations, setActiveCitations] = useState([])
    const [activeChunks, setActiveChunks] = useState([])

    const nf = useMemo(() => new Intl.NumberFormat("hu-HU"), []);
    const fmt = (n) => (typeof n === "number" && Number.isFinite(n) ? nf.format(n) : "—");

    const MAX_CHARS = 1000

    async function openSources(citations = []) {
        const ids = (citations ?? []).map(c => c.chunkId).filter(Boolean)
        if (!ids.length) return

        setActiveCitations(citations)
        setSourcesOpen(true)
        setSourcesLoading(true)

        try {
            const cached = []
            const missing = []

            for (const id of ids) {
                const hit = chunkCacheRef.current.get(id)
                if (hit) cached.push(hit)
                else missing.push(id)
            }

            let fetched = []
            if (missing.length) {
                const res = await getChunksByIdsAction(missing)
                if (res?.ok && Array.isArray(res.chunks)) {
                    fetched = res.chunks
                    for (const ch of fetched) {
                        chunkCacheRef.current.set(ch.id, ch)
                    }
                }
            }

            const merged = new Map([...cached, ...fetched].map((x) => [x.id, x]))
            const ordered = ids.map((id) => merged.get(id)).filter(Boolean)

            setActiveChunks(ordered)
        } finally {
            setSourcesLoading(false)
        }
    }

    const tokenTotals = useMemo(() => {
        return messages.reduce(
            (acc, m) => {
                const u = m.usage
                if (!u) return acc
                acc.input += u.input_tokens ?? 0
                acc.output += u.output_tokens ?? 0
                acc.total += u.total_tokens ?? ((u.input_tokens ?? 0) + (u.output_tokens ?? 0))
                return acc
            },
            { input: 0, output: 0, total: 0 }
        )
    }, [messages])

    const filteredSubTopics = useMemo(() => {
        if (!selectedTopicId) return []
        return (subTopics ?? []).filter((s) => s.topicId === selectedTopicId)
    }, [subTopics, selectedTopicId])

    const filteredChunks = useMemo(() => {
        if (!selectedSubTopicId) return []
        return (chunks ?? []).filter((c) => c.subTopicId === selectedSubTopicId)
    }, [chunks, selectedSubTopicId])

    const hasTopics = () => Array.isArray(topics) && topics.length > 0
    const hasSubTopics = () => filteredSubTopics.length > 0

    const onSelectTopic = (id) => {
        setSelectedTopicId(id)
        setSelectedSubTopicId("")
        setSelectedChunkId("")
    }

    const onSelectSubTopic = (id) => {
        setSelectedSubTopicId(id)
        setSelectedChunkId("")
    }

    const onSelectChunk = (id) => setSelectedChunkId(id)

    const effectiveSubTopicId = useMemo(() => {
        if (!selectedTopicId) return ""
        return filteredSubTopics.some(s => s.id === selectedSubTopicId) ? selectedSubTopicId : ""
    }, [selectedTopicId, selectedSubTopicId, filteredSubTopics])

    const effectiveChunkId = useMemo(() => {
        if (!effectiveSubTopicId) return ""
        return filteredChunks.some(c => c.id === selectedChunkId) ? selectedChunkId : ""
    }, [effectiveSubTopicId, selectedChunkId, filteredChunks])

    const chatHistoryJson = useMemo(() => {
        const last = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
        return JSON.stringify(last)
    }, [messages])

    useEffect(() => {
        if (!state?.responseId) return

        if (lastHandledResponseId.current === state.responseId) return
        lastHandledResponseId.current = state.responseId

        if (state?.token) setTokenInfo(state.token)
        if (!state.ok) return

        queueMicrotask(() => {
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: state.answer ?? "", citations: state.citations || [], usage: state.usage ?? null, },
            ])
            setQuestion("")
            formRef.current?.reset()
        })
    }, [state?.responseId])

    useEffect(() => {
        if (!messages.length) return
        scrollToBottom()
    }, [messages.length])

    function handleNewChat() {
        setSelectedTopicId("")
        setSelectedSubTopicId("")
        setSelectedChunkId("")
        setMessages([])
        setQuestion("")
        formRef.current?.reset()
        lastHandledResponseId.current = null
    }

    const handleSubmit = () => {
        const q = question.trim()
        if (q.length < 4) return
        setMessages(prev => [...prev, { role: "user", text: q }])
    }

    const outOfTokens = !tokenInfo?.isUnlimited && tokenInfo?.remaining === 0;
    const uiDisabled = pending || outOfTokens;

    // Pending alatt: ha már van user üzenet, mutassunk "assistant typing" skeleton-t
    const showTyping = pending && !outOfTokens && messages.length > 0 && messages[messages.length - 1]?.role === "user"

    return (
        <div className="h-[calc(100vh-68px)] grid gap-4 lg:grid-cols-[360px_1fr] items-stretch pb-4 min-h-0">
            <Card className={`p-4 space-y-2 flex flex-col ${outOfTokens ? "opacity-60 pointer-events-none" : ""}`}>
                <TopicSelector
                    topics={topics}
                    selectedTopicId={selectedTopicId}
                    setSelectedTopicId={onSelectTopic}
                    hasTopics={hasTopics}
                />

                <Separator />

                <SubTopicSelector
                    subTopics={selectedTopicId ? filteredSubTopics : []}
                    selectedSubTopicId={selectedSubTopicId}
                    setSelectedSubTopicId={onSelectSubTopic}
                    hasSubTopics={hasSubTopics}
                    selectedTopicId={selectedTopicId}
                />

                <Separator />

                <ChunkSelector
                    chunks={selectedTopicId && selectedSubTopicId ? filteredChunks : []}
                    selectedChunkId={selectedChunkId}
                    setSelectedChunkId={onSelectChunk}
                    hasChunks={filteredChunks.length > 0}
                />

                <Button type="button" className="mt-auto" onClick={handleNewChat} disabled={uiDisabled}>
                    <RotateCcw className="h-4 w-4" />
                    Új beszélgetés indítása
                </Button>
            </Card>

            <Card className="h-full flex flex-col min-h-0 overflow-hidden">
                <div
                    ref={scrollRef}
                    className="flex-1 min-h-0 space-y-3 bg-muted/5 overflow-y-auto scroll-smooth px-4 py-4"
                >
                    {outOfTokens ? (
                        <div className="border rounded-xl bg-destructive/10 p-4 text-sm text-destructive space-y-1">
                            <div className="font-medium">Elfogyott a token kereted.</div>
                            <div>Új üzenetet nem tudsz küldeni, amíg nem kapsz új keretet.</div>
                        </div>
                    ) : null}

                    {state?.error ? (
                        <div className="border rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                            {state.error}
                        </div>
                    ) : null}

                    {!messages.length ? (
                        <div className="border rounded-xl bg-muted/10 p-4 text-sm text-muted-foreground">
                            Még nincs üzenet.
                        </div>
                    ) : (
                        <>
                            {messages.map((m, idx) => (
                                <div key={idx} className="space-y-2">
                                    <ChatBubble role={m.role}>{m.text}</ChatBubble>

                                    {m.role === "assistant" && m.citations?.length ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {m.citations.map((c) => (
                                                <button
                                                    key={`${c.chunkId}-${c.sourceIndex}`}
                                                    type="button"
                                                    onClick={() => openSources([c])}
                                                    className={`text-xs px-2 py-0.5 rounded-full border bg-muted/20 hover:bg-muted/40 ${uiDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                                                    title={c.title ? c.title : `Forrás [${c.sourceIndex}]`}
                                                    disabled={uiDisabled}
                                                >
                                                    [{c.sourceIndex}]
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => openSources(m.citations)}
                                                className={`text-xs text-muted-foreground underline ${uiDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                                                disabled={uiDisabled}
                                                title="Összes forrás megnyitása"
                                            >
                                                összes ({m.citations.length})
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}

                            {showTyping ? <TypingBubble /> : null}

                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                <Item className="items-end py-2 px-4">
                    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="w-full flex gap-4 items-end">
                        <ItemContent>
                            <input type="hidden" name="topicId" value={selectedTopicId} />
                            <input type="hidden" name="subTopicId" value={effectiveSubTopicId} />
                            <input type="hidden" name="chunkId" value={effectiveChunkId} />
                            <input type="hidden" name="maxUiCitations" value="2" />
                            <input type="hidden" name="chatHistoryJson" value={chatHistoryJson} />

                            <Textarea
                                id="question"
                                name="question"
                                placeholder="Írd be a kérdésed…"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={MAX_CHARS}
                                disabled={!selectedTopicId || !selectedSubTopicId || pending || outOfTokens}
                                required
                            />
                        </ItemContent>

                        <ItemActions>
                            <Button
                                type="submit"
                                variant=""
                                size="icon"
                                disabled={
                                    pending ||
                                    !selectedTopicId ||
                                    !selectedSubTopicId ||
                                    outOfTokens ||
                                    question.trim().length < 4
                                }
                                title="Küldés"
                            >
                                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </ItemActions>
                    </form>

                    <ItemFooter>
                        <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span>{question.length}/{MAX_CHARS} (min 4 karakter)</span>

                            <span>
                                Token összesen: in {fmt(tokenTotals.input)} • out {fmt(tokenTotals.output)} • össz {fmt(tokenTotals.total)}
                            </span>

                            {tokenInfo ? (
                                <span>
                                    Keret: {fmt(tokenInfo.used)} / {fmt(tokenInfo.limit)} • maradék {fmt(tokenInfo.remaining)}
                                </span>
                            ) : (
                                <span>Keret: betöltés…</span>
                            )}
                        </div>
                    </ItemFooter>
                </Item>
            </Card>

            <Dialog open={sourcesOpen} onOpenChange={setSourcesOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Források</DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[70vh] overflow-y-auto space-y-4">
                        {sourcesLoading ? (
                            <div className="text-sm text-muted-foreground">Betöltés…</div>
                        ) : activeChunks.length ? (
                            activeChunks.map((ch) => {
                                const c = activeCitations.find(x => x.chunkId === ch.id)
                                const label = c?.sourceIndex ?? "?"

                                return (
                                    <div key={ch.id} className="rounded-xl border p-3 space-y-2">
                                        <div className="text-sm font-medium">
                                            [{label}] {ch.title || "Forrás"}
                                        </div>

                                        {c?.score != null ? (
                                            <div className="text-xs text-muted-foreground">
                                                Relevancia: {Math.round(c.score * 100)}%
                                            </div>
                                        ) : null}

                                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {ch.text}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-sm text-muted-foreground">Nincs elérhető forrás.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default RagChatPanel
