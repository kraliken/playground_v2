"use client"

import { Loader2, RotateCcw, Send } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Separator } from "../ui/separator"
import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import { Textarea } from "../ui/textarea"
import TopicSelector from "../shared/TopicSelector"
import { getChunksByTopicId } from "@/lib/actions/chunk"
import ChunkSelector from "../shared/ChunkSelector"
import ChatBubble from "./ChatBubble"
import SubTopicSelector from "../shared/SubTopicSelector"
import { Item, ItemActions, ItemContent, ItemFooter } from "../ui/item"
import { askRagAction, getChunksByIdsAction } from "@/action/chat"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"

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

const RagChatPanel = ({ topics, subTopics, chunks, initialToken }) => {

    // -----------------------------
    // 1) Server action bekötése
    // -----------------------------
    // state: a server action legutóbbi válasza
    // formAction: ezt adjuk a <form action={formAction}>-nak
    // pending: true amíg fut a server action
    const [state, formAction, pending] = useActionState(askRagAction, initialState)

    // -----------------------------
    // 2) Kiválasztások (bal panel)
    // -----------------------------
    const [selectedTopicId, setSelectedTopicId] = useState("")
    const [selectedSubTopicId, setSelectedSubTopicId] = useState("")
    const [selectedChunkId, setSelectedChunkId] = useState("")

    // -----------------------------
    // 3) UI state (chat)
    // -----------------------------
    const scrollRef = useRef(null)               // chat ablak scroll container
    const formRef = useRef(null)                 // form reset-hez
    const lastHandledResponseId = useRef(null)   // hogy ne dolgozzuk fel 2x ugyanazt a választ (Strict Mode)
    const [messages, setMessages] = useState([]) // { role:'user'|'assistant', text:'...', citations?:[] }
    const [question, setQuestion] = useState("") // textarea controlled value

    const [tokenInfo, setTokenInfo] = useState(initialToken ?? null);


    const chunkCacheRef = useRef(new Map()) // chunkId -> chunkData

    const bottomRef = useRef(null)

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }


    const [sourcesOpen, setSourcesOpen] = useState(false)
    const [sourcesLoading, setSourcesLoading] = useState(false)
    const [activeCitations, setActiveCitations] = useState([]) // a kattintott message citations-je
    const [activeChunks, setActiveChunks] = useState([])       // betöltött chunkok

    const nf = useMemo(() => new Intl.NumberFormat("hu-HU"), []);
    const fmt = (n) => (typeof n === "number" && Number.isFinite(n) ? nf.format(n) : "—");


    // textarea limit (frontend)
    // (server oldalon is van clamp/guard, de UI-ban jó, ha nem engedünk végtelen paste-et)
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

    // -----------------------------
    // 4) Szűrések a kiválasztás alapján
    // -----------------------------
    // SubTopic szűrés: csak a kiválasztott topichoz tartozó subtopicok
    const filteredSubTopics = useMemo(() => {
        if (!selectedTopicId) return []
        return (subTopics ?? []).filter((s) => s.topicId === selectedTopicId)
    }, [subTopics, selectedTopicId])

    // Chunk szűrés: csak a kiválasztott subtopichoz tartozó chunkok
    const filteredChunks = useMemo(() => {
        if (!selectedSubTopicId) return []
        return (chunks ?? []).filter((c) => c.subTopicId === selectedSubTopicId)
    }, [chunks, selectedSubTopicId])


    // “van-e adat” helper-ek
    // Fontos: ha hasTopics / hasSubTopics függvény, a gyermek komponensben hasTopics() legyen meghívva.
    // (Nálad korábban volt ebből bug.)
    const hasTopics = () => Array.isArray(topics) && topics.length > 0
    const hasSubTopics = () => filteredSubTopics.length > 0

    const onSelectTopic = (id) => {
        setSelectedTopicId(id)
        setSelectedSubTopicId("") // mindig reset
        setSelectedChunkId("")    // mindig reset
    }

    const onSelectSubTopic = (id) => {
        setSelectedSubTopicId(id)
        setSelectedChunkId("") // mindig reset
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


    // -----------------------------
    // 6) Chat history (hidden inputba)
    // -----------------------------
    // Csak az utolsó 6 üzenetet küldjük vissza a server actionnek
    // (server oldalon is vágjuk, de UI-ban is rendben)
    const chatHistoryJson = useMemo(() => {
        const last = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
        return JSON.stringify(last)
    }, [messages])

    // -----------------------------
    // 7) Segéd: scroll aljára
    // -----------------------------
    // function scrollToBottom() {
    //     const el = scrollRef.current
    //     if (!el) return
    //     el.scrollTop = el.scrollHeight
    // }

    // -----------------------------
    // 8) Server action válasz feldolgozása
    // -----------------------------
    // Amikor a server action lefut, state.responseId változik.
    // Ekkor:
    // - ha ok: hozzáadjuk a kérdést + választ a messages-hez
    // - inputot ürítjük
    // - scroll aljára
    useEffect(() => {
        if (!state?.responseId) return

        // ugyanazt a választ ne dolgozzuk fel kétszer (Strict Mode / re-render miatt)
        if (lastHandledResponseId.current === state.responseId) return
        lastHandledResponseId.current = state.responseId

        // token infó frissítés (akkor is, ha hiba)
        if (state?.token) setTokenInfo(state.token)

        // ha nem ok, akkor itt nem pusholjuk a chatbe
        // (a hibát megjelenítjük külön UI-ban)
        if (!state.ok) return

        queueMicrotask(() => {
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: state.answer ?? "", citations: state.citations || [], usage: state.usage ?? null, },
            ])
            setQuestion("")
            formRef.current?.reset()
            // setTimeout(scrollToBottom, 0)
        })
    }, [state?.responseId]) // szándékosan csak responseId-ra figyelünk

    useEffect(() => {
        // ha nincs még semmi, ne
        if (!messages.length) return
        scrollToBottom()
    }, [messages.length])
    // -----------------------------
    // 9) “Új chat” gomb
    // -----------------------------
    function handleNewChat() {
        // A legbiztonságosabb reset:
        // - kiválasztásokat és üzeneteket is ürítünk
        setSelectedTopicId("")
        setSelectedSubTopicId("")
        setSelectedChunkId("")
        setMessages([])

        setQuestion("")
        formRef.current?.reset()

        // hogy a következő válasz biztosan feldolgozódjon
        lastHandledResponseId.current = null

        // setTimeout(scrollToBottom, 0)
    }

    const handleSubmit = () => {
        const q = question.trim()
        if (q.length < 4) return
        setMessages(prev => [...prev, { role: "user", text: q }])
    }

    const outOfTokens = !tokenInfo?.isUnlimited && tokenInfo?.remaining === 0;

    const uiDisabled = pending || outOfTokens;

    // -----------------------------
    // 10) Render
    // -----------------------------
    return (
        // <div className="min-h-[calc(100vh-68px)] grid gap-4 lg:grid-cols-[360px_1fr] items-stretch pb-4">
        <div className="h-[calc(100vh-68px)] grid gap-4 lg:grid-cols-[360px_1fr] items-stretch pb-4 min-h-0">
            {/* ---------------------------
          LEFT SIDE: választók
         --------------------------- */}
            <Card className={`p-4 space-y-2 flex flex-col ${outOfTokens ? "opacity-60 pointer-events-none" : ""}`}>
                <TopicSelector
                    topics={topics}
                    selectedTopicId={selectedTopicId}
                    setSelectedTopicId={onSelectTopic}
                    hasTopics={hasTopics} // ha a TopicSelector-ben függvényként használod, akkor hasTopics() legyen
                />

                <Separator />

                <SubTopicSelector
                    subTopics={selectedTopicId ? filteredSubTopics : []}
                    selectedSubTopicId={selectedSubTopicId}
                    setSelectedSubTopicId={onSelectSubTopic}
                    hasSubTopics={hasSubTopics} // ha a SubTopicSelector-ben függvényként használod, akkor hasSubTopics()
                    selectedTopicId={selectedTopicId}
                />

                <Separator />

                <ChunkSelector
                    chunks={selectedTopicId && selectedSubTopicId ? filteredChunks : []}
                    selectedChunkId={selectedChunkId}
                    setSelectedChunkId={onSelectChunk}
                    // Itt egyszerűbb boolean-t adni, hogy biztosan jó legyen a disabled
                    hasChunks={filteredChunks.length > 0}
                />

                {/* mt-auto: “lenyomja” az aljára a flex columnban */}
                <Button type="button" className="mt-auto" onClick={handleNewChat} disabled={uiDisabled}>
                    <RotateCcw className="h-4 w-4" />
                    Új beszélgetés indítása
                </Button>
            </Card>

            {/* ---------------------------
          RIGHT SIDE: chat + input
         --------------------------- */}
            {/* <Card className="h-full flex flex-col"> */}
            <Card className="h-full flex flex-col min-h-0 overflow-hidden">

                {/* CHAT WINDOW */}
                {/* <div ref={scrollRef} className="flex-1 space-y-3 bg-muted/5 overflow-y-auto px-4 py-4"> */}
                <div
                    ref={scrollRef}
                    className="flex-1 min-h-0 space-y-3 bg-muted/5 overflow-y-auto scroll-smooth px-4 py-4"
                >
                    {outOfTokens ? (
                        <div className="border rounded-xl bg-destructive/10 p-4 text-sm text-destructive space-y-1">
                            <div className="font-medium">Elfogyott a token kereted.</div>
                            {/* <div>
                                Keret: {tokenInfo?.used}/{tokenInfo?.limit} • maradék {tokenInfo?.remaining}
                            </div> */}
                            <div>Új üzenetet nem tudsz küldeni, amíg nem kapsz új keretet.</div>
                        </div>
                    ) : null}

                    {/* Ha van hiba a server actiontől, kiírjuk */}
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

                            <div ref={bottomRef} />
                        </>
                    )}

                </div>

                {/* CHAT INPUT FORM */}
                <Item className="items-end py-2 px-4">
                    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="w-full flex gap-4 items-end">
                        <ItemContent>
                            {/* Hidden mezők: ezek mennek a server actionbe */}
                            <input type="hidden" name="topicId" value={selectedTopicId} />
                            <input type="hidden" name="subTopicId" value={effectiveSubTopicId} />
                            <input type="hidden" name="chunkId" value={effectiveChunkId} />

                            {/* Opcionális: UI citations limit (ha használod) */}
                            <input type="hidden" name="maxUiCitations" value="2" />

                            {/* Chat history (utolsó 6 üzenet) */}
                            <input type="hidden" name="chatHistoryJson" value={chatHistoryJson} />

                            <Textarea
                                id="question"
                                name="question"
                                placeholder="Írd be a kérdésed…"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={MAX_CHARS}
                                // akkor engedjük, ha van kiválasztott topic + subtopic
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