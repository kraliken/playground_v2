"use server"

import { getUserIdOrResult, auth } from "../auth";
import { connectToDatabase } from "../database/connection/mongoose";
import { Topic } from "../database/models/Topic";
import { AskSchema } from "../schemas/ask.schemas";
import { buildRagPrompt } from "../services/openai";
import { vectorSearchSubchunks } from "../services/vector.search.service";
import { appendHistoryToUserPrompt } from "../utils/chat";
import { pickCitationsForUi } from "../utils/citations";
import { parseChatHistory } from "../utils/parseChatHistory";
import { chatAnswer, embedTexts } from "./openai";


export async function askRagAction(prevState, formData) {

    const responseId = `${Date.now()}-${Math.random().toString(16).slice(2)}`

    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, topics: [], statusCode: 401 };

    const userId = authRes.userId;

    const rawFormData = Object.fromEntries(formData);

    const parsed = AskSchema.safeParse(rawFormData)

    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message || "Hibás adatok.", answer: "", citations: [], responseId }
    }

    try {

        await connectToDatabase()

        const topic = await Topic.findOne({ _id: parsed.data.topicId }).lean()
        const history = parseChatHistory(parsed.data.chatHistoryJson)

        const [qEmbedding] = await embedTexts([parsed.data.question], { model: "text-embedding-3-small" })
        if (!qEmbedding) return { ok: false, error: "Nem sikerült embeddinget készíteni.", answer: "", citations: [], responseId }
        // console.log(parsed.data.question);
        // console.log(parsed.data.topicId);
        // console.log(userId);

        // 2) retrieval (topic-on belül)
        const baseRetrieved = await vectorSearchSubchunks({
            userId,
            topicId: parsed.data.topicId,
            queryVector: qEmbedding,
            topK: parsed.data.topK,
            numCandidates: Math.max(parsed.data.topK * 10, 60),
            indexName: "subchunks_embedding_index",
        })

        console.log(baseRetrieved);

        if (!baseRetrieved.length) {
            return {
                ok: true,
                error: "",
                topic: { id: String(topic._id), name: topic.name, slug: topic.slug },
                question: parsed.data.question,
                answer: "Nincs elég információ a forrásokban.",
                citations: [],
                responseId,
                debug: { usedContexts: 0, usedContextChars: 0, topK: parsed.data.topK, scopeApplied: false },
            }
        }

        // 3) STRICT SCOPE: ha van scope, csak abból dolgozunk – nincs fallback.
        const scope = (parsed.data.scopeSubTitle || "").trim()
        let retrieved = baseRetrieved
        let scopeApplied = false

        if (scope) {
            const scoped = baseRetrieved.filter((r) => String(r.subTitle || "").trim() === scope)
            scopeApplied = true

            if (!scoped.length) {
                return {
                    ok: true,
                    error: "",
                    topic: { id: String(topic._id), name: topic.name, slug: topic.slug },
                    question: parsed.data.question,
                    answer:
                        `Ebben az alcímben nem találtam releváns részt a kérdéshez: "${scope}". ` +
                        `Próbáld meg: (1) válts "Összes alcím"-re, vagy (2) válassz másik alcímet.`,
                    citations: [],
                    responseId,
                    debug: {
                        scope,
                        scopeApplied,
                        scopeNoMatch: true,
                        topK: parsed.data.topK,
                        historyCount: history.length,
                    },
                }
            }

            retrieved = scoped
        }

        // 4) prompt (MÁR CSAK a scope-ból, ha scope aktív)
        const prompt = buildRagPrompt({
            question: parsed.data.question,
            contexts: retrieved,
            maxContextChars: parsed.data.maxContextChars,
            perChunkChars: 1800,
        })

        const userPromptWithHistory = appendHistoryToUserPrompt(prompt.user, history)

        // 5) LLM
        const llm = await chatAnswer({
            model: "gpt-5-mini",
            system: prompt.system,
            user: userPromptWithHistory,
            temperature: 0.2,
        })

        console.log(llm.text);

        const answer = (llm.text || "").trim() || "Nincs elég információ a forrásokban."

        // 6) citations UI
        const citationsForUi = pickCitationsForUi(retrieved, {
            max: parsed.data.maxUiCitations,
            delta: parsed.data.uiScoreDelta,
            minScore: parsed.data.uiMinScore,
        })

        const citations = citationsForUi.map((r, idx) => ({
            n: idx + 1,
            subchunkId: r.subchunkId,
            score: r.score,
            text: r.text.length > 800 ? r.text.slice(0, 800) : r.text,
            preview: r.preview || "",
            source: r.source,
            subTitle: r.subTitle || "",
            chunkIndex: r.chunkIndex,
            subIndex: r.subIndex,
            uploadedByName: r.uploadedByName || "",
            topicId: parsed.data.topicId, // modalhoz hasznos
        }))

        return {
            ok: true,
            error: "",
            topic: { id: String(topic._id), name: topic.name, slug: topic.slug },
            question: parsed.data.question,
            answer,
            citations,
            responseId,
            debug: {
                usedContexts: prompt.usedContexts,
                usedContextChars: prompt.usedContextChars,
                topK: parsed.data.topK,
                scope: scope || "",
                scopeApplied,
                historyCount: history.length,
            },
        }


    } catch (error) {

        console.error("askRagAction error:", error)
        return {
            ok: false,
            error: "Nem sikerült válaszolni.",
        }

    }

}