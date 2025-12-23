"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Separator } from "../ui/separator"
import { Textarea } from "../ui/textarea"
import { Item, ItemActions, ItemContent, ItemFooter } from "../ui/item"
import { Loader2, RotateCcw, Send, Square } from "lucide-react"
import TopicSelector from "../shared/TopicSelector"
import SubTopicSelector from "../shared/SubTopicSelector"
import ChunkSelector from "../shared/ChunkSelector"
import ChatBubble from "./ChatBubble"

export default function RagChatStreamPanel({ topics, subTopics, chunks }) {
    const [selectedTopicId, setSelectedTopicId] = useState("")
    const [selectedSubTopicId, setSelectedSubTopicId] = useState("")
    const [selectedChunkId, setSelectedChunkId] = useState("")

    const [messages, setMessages] = useState([])
    const [question, setQuestion] = useState("")
    const [pending, setPending] = useState(false)
    const [lastUsage, setLastUsage] = useState(null)

    const scrollRef = useRef(null)
    const bottomRef = useRef(null)
    const abortRef = useRef(null)

    const MAX_CHARS = 1000

    const filteredSubTopics = useMemo(() => {
        if (!selectedTopicId) return []
        return (subTopics ?? []).filter((s) => s.topicId === selectedTopicId)
    }, [subTopics, selectedTopicId])

    const filteredChunks = useMemo(() => {
        if (!selectedSubTopicId) return []
        return (chunks ?? []).filter((c) => c.subTopicId === selectedSubTopicId)
    }, [chunks, selectedSubTopicId])

    const chatHistory = useMemo(() => {
        return messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
    }, [messages])

    function isNearBottom() {
        const el = scrollRef.current
        if (!el) return true
        const threshold = 120
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    }

    function scrollToBottomSmooth() {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }

    async function handleNewChat() {
        abortRef.current?.abort()
        abortRef.current = null
        setSelectedTopicId("")
        setSelectedSubTopicId("")
        setSelectedChunkId("")
        setMessages([])
        setQuestion("")
        setPending(false)
        setLastUsage(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const q = question.trim()
        if (q.length < 4 || pending) return

        setPending(true)
        setLastUsage(null)

        // user message + üres assistant placeholder
        const assistantId = crypto.randomUUID()
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", text: q },
            { id: assistantId, role: "assistant", text: "", citations: [] },
        ])
        setQuestion("")

        const shouldAutoScroll = isNearBottom()

        const ac = new AbortController()
        abortRef.current = ac

        try {
            // ✅ Tesztként most “contextText”-et küldünk: később itt küldheted a chunkId-kat és a szerver összerakja.
            const contextText = "" // ide később be lehet húzni a kiválasztott chunk szövegét serverből

            const res = await fetch("/api/rag/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: ac.signal,
                body: JSON.stringify({
                    question: q,
                    topicId: selectedTopicId,
                    subTopicId: selectedSubTopicId,
                    chunkId: selectedChunkId,
                    chatHistory,
                    contextText,
                }),
            })

            if (!res.ok || !res.body) {
                throw new Error("Nem sikerült streamelni.")
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""

            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })

                // NDJSON sorok feldolgozása
                let idx
                while ((idx = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, idx).trim()
                    buffer = buffer.slice(idx + 1)
                    if (!line) continue

                    const msg = JSON.parse(line)

                    if (msg.type === "delta") {
                        const delta = msg.delta ?? ""
                        setMessages((prev) =>
                            prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m))
                        )
                        if (shouldAutoScroll) scrollToBottomSmooth()
                    }

                    if (msg.type === "done") {
                        setLastUsage(msg.usage ?? null)
                    }

                    if (msg.type === "error") {
                        throw new Error(msg.error ?? "Ismeretlen hiba.")
                    }
                }
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", text: `Hiba: ${err.message}` },
            ])
        } finally {
            setPending(false)
            abortRef.current = null
            scrollToBottomSmooth()
        }
    }

    return (
        <div className="h-[calc(100vh-68px)] grid gap-4 lg:grid-cols-[360px_1fr] items-stretch pb-4 min-h-0">
            <Card className="p-4 space-y-2 flex flex-col min-h-0">
                <TopicSelector
                    topics={topics}
                    selectedTopicId={selectedTopicId}
                    setSelectedTopicId={(id) => {
                        setSelectedTopicId(id)
                        setSelectedSubTopicId("")
                        setSelectedChunkId("")
                    }}
                    hasTopics={() => Array.isArray(topics) && topics.length > 0}
                />

                <Separator />

                <SubTopicSelector
                    subTopics={selectedTopicId ? filteredSubTopics : []}
                    selectedSubTopicId={selectedSubTopicId}
                    setSelectedSubTopicId={(id) => {
                        setSelectedSubTopicId(id)
                        setSelectedChunkId("")
                    }}
                    hasSubTopics={() => filteredSubTopics.length > 0}
                    selectedTopicId={selectedTopicId}
                />

                <Separator />

                <ChunkSelector
                    chunks={selectedTopicId && selectedSubTopicId ? filteredChunks : []}
                    selectedChunkId={selectedChunkId}
                    setSelectedChunkId={setSelectedChunkId}
                    hasChunks={filteredChunks.length > 0}
                />

                <Button type="button" className="mt-auto" onClick={handleNewChat} disabled={pending}>
                    <RotateCcw className="h-4 w-4" />
                    Új beszélgetés indítása
                </Button>
            </Card>

            <Card className="h-full flex flex-col min-h-0 overflow-hidden">
                <div
                    ref={scrollRef}
                    className="flex-1 min-h-0 space-y-3 bg-muted/5 overflow-y-auto scroll-smooth px-4 py-4"
                >
                    {!messages.length ? (
                        <div className="border rounded-xl bg-muted/10 p-4 text-sm text-muted-foreground">
                            Stream teszt: válassz témát, majd kérdezz.
                        </div>
                    ) : (
                        <>
                            {messages.map((m) => (
                                <div key={m.id} className="space-y-2">
                                    <ChatBubble role={m.role}>{m.text}</ChatBubble>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                <Item className="items-end py-2 px-4">
                    <form onSubmit={handleSubmit} className="w-full flex gap-4 items-end">
                        <ItemContent>
                            <Textarea
                                id="question"
                                name="question"
                                placeholder="Írd be a kérdésed…"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={MAX_CHARS}
                                disabled={!selectedTopicId || !selectedSubTopicId || pending}
                                required
                            />
                        </ItemContent>

                        <ItemActions className="flex gap-2">
                            {pending ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => abortRef.current?.abort()}
                                    title="Megszakítás"
                                >
                                    <Square className="h-4 w-4" />
                                </Button>
                            ) : null}

                            <Button
                                type="submit"
                                size="icon"
                                disabled={!selectedTopicId || !selectedSubTopicId || question.trim().length < 4 || pending}
                                title="Küldés"
                            >
                                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </ItemActions>
                    </form>

                    <ItemFooter>
                        <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span>{question.length}/{MAX_CHARS} (min 4 karakter)</span>
                            {lastUsage?.total_tokens != null ? (
                                <span>Token (utolsó válasz): {lastUsage.total_tokens}</span>
                            ) : null}
                        </div>
                    </ItemFooter>
                </Item>
            </Card>
        </div>
    )
}
