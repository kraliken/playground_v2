"use server"

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import { Chunk } from "@/lib/database/models/Chunk";
import { User } from "@/lib/database/models/User";
import { AskSchema } from "@/lib/schemas/ask";
import mongoose from "mongoose";
import OpenAI from "openai"

// ----------------------------
// 1) OpenAI kliens (biztonságosan)
// ----------------------------
function getClient() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");
    return new OpenAI({ apiKey: key });
}

// ----------------------------
// 2) Segédfüggvény: szöveg levágása max karakterre
//    (ezzel védjük a prompt méretet)
// ----------------------------
function clamp(str, max) {
    const s = String(str ?? "");
    if (s.length <= max) return s;
    return s.slice(0, max);
}

// ----------------------------
// 3) Chat history parse (itt egyszerűen, Zod nélkül)
//    - csak a legutolsó 6 üzenetet tartjuk meg
//    - ha rossz a JSON, üres tömb
// ----------------------------
function parseChatHistory(chatHistoryJson) {
    if (!chatHistoryJson) return [];
    try {
        const raw = JSON.parse(chatHistoryJson);
        if (!Array.isArray(raw)) return [];
        return raw.slice(-6).map((m) => ({
            role: m?.role === "assistant" ? "assistant" : "user",
            text: String(m?.text ?? ""),
        }));
    } catch {
        return [];
    }
}

// ----------------------------
// 4) Prompt építés a chunkokból
//    - perChunkChars: 1 chunk max hossza
//    - maxContextChars: összes forrás max hossza
// ----------------------------
function buildPromptFromChunks({
    question,
    history = [],
    chunks = [],
    // maxContextChars = 9000,
    // perChunkChars = 1800,
}) {
    // a kérdést is levágjuk, nehogy valaki 20 oldalt beillesszen
    const safeQuestion = clamp(question, 1000).trim();

    // FORRÁSOK blokk: karakter budget kontroll
    let used = 0;
    const blocks = [];

    for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];

        // [1], [2] jelölések a hivatkozáshoz
        const label = `[${i + 1}]`;

        // egyszerű header: chunk title
        const header = c.title ? `(${c.title})` : "";

        // 1 chunk szövegét levágjuk perChunkChars-ra
        // const body = clamp(c.text ?? "", perChunkChars).trim();

        // const block = `${label} ${header}\n${body}`;
        const block = `${label} ${header}\n${c.text}`;
        const blockLen = block.length + 2;

        // ha már nem fér bele a teljes budgetbe, nem teszünk több forrást
        // if (used + blockLen > maxContextChars) break;

        used += blockLen;
        blocks.push(block);
    }

    const sourcesText = blocks.length
        ? `FORRÁSOK:\n\n${blocks.join("\n\n")}`
        : "FORRÁSOK:\n\n(nincs találat)";

    // előzmények röviden (opcionális)
    const historyText =
        history.length > 0
            ? [
                "ELŐZMÉNYEK (röviden):",
                ...history.map((m) => {
                    const who = m.role === "assistant" ? "Asszisztens" : "Felhasználó";
                    return `- ${who}: ${m.text}`;
                    // return `- ${who}: ${clamp(m.text, 400)}`;
                }),
                "",
            ].join("\n")
            : "";

    // user üzenet: források + kérdés + utasítás

    // "- Hivatkozz a forrásokra a mondatok végén így: [1], [2] ...",
    const user = [
        sourcesText,
        "",
        historyText,
        `KÉRDÉS:\n${safeQuestion}`,
        "",
        "KÉRÉS:",
        "- A választ kizárólag a FORRÁSOK alapján add meg.",
        "- Ha nincs elég információ, mondd pontosan: „Nincs elég információ a forrásokban.”",
    ]
        .filter(Boolean)
        .join("\n");

    return { user, usedContextChars: used, usedContexts: blocks.length };
}

// ----------------------------
// Token helper: fallback + számolás
// ----------------------------
function normalizeTokenState(userDoc) {
    const limit = Number(userDoc?.tokenLimit ?? 50000);
    const used = Number(userDoc?.tokensUsed ?? 0);
    const remaining = Math.max(0, limit - used);
    return { limit, used, remaining };
}

function getTotalTokensFromUsage(usage) {
    if (!usage) return 0;
    // OpenAI Responses API usage mezők:
    // - total_tokens
    // - input_tokens / output_tokens
    const total =
        usage.total_tokens ??
        (Number(usage.input_tokens ?? 0) + Number(usage.output_tokens ?? 0));
    return Number(total) || 0;
}

// ----------------------------
// 5) A server action
// ----------------------------
export async function askRagAction(prevState, formData) {

    // 5.1 Auth
    const session = await auth();

    if (!session.user) {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    const userId = session.user.id;
    const isAdmin = session.user.role === "admin";

    console.log("admin? ", isAdmin);


    // 5.2 Response id (debughoz jó)
    const responseId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // 5.3 Form data -> objektum
    const rawFormData = Object.fromEntries(formData);

    // 5.4 Zod validáció
    const parsed = AskSchema.safeParse(rawFormData)

    if (!parsed.success) {
        const fieldErrors = {};
        parsed.error.issues.forEach((issue) => {
            const fieldName = issue.path[0];
            if (!fieldErrors[fieldName]) fieldErrors[fieldName] = issue.message;
        });
        return { ok: false, error: "Validációs hiba", errors: fieldErrors, data: rawFormData, responseId };
    }

    // 5.5 Kinyerjük a mezőket
    const { subTopicId, chunkId, question, chatHistoryJson } = parsed.data;

    // 5.7 Paraméterek (később finomhangolható)
    const topK = 3
    const numCandidates = Math.max(100, topK * 30)
    const minScore = 0.75

    // prompt karakter budgetek
    // const maxContextChars = 9000;
    // const perChunkChars = 1800;

    try {
        await connectToDatabase()

        let before = null;

        if (!isAdmin) {
            // 0) Token limit ellenőrzés (DB az igazság forrása)
            const userRow = await User.findById(userId).select("tokenLimit tokensUsed").lean();
            if (!userRow) {
                return { ok: false, error: "A felhasználó nem található.", responseId };
            }

            before = normalizeTokenState(userRow);
            if (before.remaining <= 0) {
                return {
                    ok: false,
                    error: "Elfogyott a token kereted, nem tudsz több üzenetet küldeni.",
                    responseId,
                    usage: null,
                    token: before,
                    statusCode: 402,
                };
            }
        } else {
            // adminnak “végtelen” (UI-hoz)
            before = { limit: 50000, used: 0, remaining: 50000, isUnlimited: true };
        }

        const history = parseChatHistory(chatHistoryJson)
        const subTopicObjectId = new mongoose.Types.ObjectId(subTopicId)

        let retrievedChunks = [];

        const client = getClient()

        // ----------------------------
        // 6) Retrieval: ha chunkId van -> egy konkrét fejezet
        // ----------------------------
        if (chunkId) {
            const chunk = await Chunk.findOne({
                _id: new mongoose.Types.ObjectId(chunkId),
                subTopicId: subTopicObjectId,
            })
                .select("_id subTopicId title text createdAt updatedAt")
                .lean();

            if (!chunk) {
                return { ok: false, error: "A kiválasztott fejezet nem található.", answer: "", citations: [], responseId, token: before, };
            }

            retrievedChunks = [{ ...chunk, score: 1 }];

        } else {
            // ----------------------------
            // 7) Retrieval: vector search a subtopic-on belül
            // ----------------------------
            // const client = getClient()

            // 7.1 Kérdés embedding
            const embRes = await client.embeddings.create({
                model: "text-embedding-3-small",
                input: question,
            })

            const qEmbedding = embRes.data?.[0]?.embedding;
            if (!qEmbedding) {
                return { ok: false, error: "Nem sikerült embeddinget készíteni.", responseId, token: before, };
            }

            // 7.2 MongoDB Atlas Vector Search pipeline
            const pipeline = [
                {
                    $vectorSearch: {
                        index: "chunk_embedding_index",
                        path: "embedding",
                        queryVector: qEmbedding,
                        numCandidates,
                        limit: topK,
                        filter: { subTopicId: subTopicObjectId },
                    },
                },
                { $addFields: { score: { $meta: "vectorSearchScore" } } },
                { $match: { score: { $gte: minScore } } },
                {
                    $project: {
                        _id: 1,
                        score: 1,
                        subTopicId: 1,
                        title: 1,
                        text: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ];

            retrievedChunks = await Chunk.aggregate(pipeline);

            // console.log("retrievedChunks: ", retrievedChunks);

            // 7.3 Fallback: ha túl szigorú volt a score küszöb
            if (!retrievedChunks.length) {
                const fallbackPipeline = pipeline.filter((s) => !("$match" in s));
                retrievedChunks = await Chunk.aggregate(fallbackPipeline);
            }
        }

        // ----------------------------
        // 8) Ha nincs semmi context -> ne hívjunk LLM-et
        // ----------------------------
        if (!retrievedChunks.length) {
            return {
                ok: true,
                error: "",
                question,
                answer: "Nincs elég információ a forrásokban.",
                citations: [],
                usage: null, // ✅
                responseId,
                token: before,
            };
        }

        // ----------------------------
        // 9) Citations (UI-hoz)
        //    sourceIndex: [1], [2] ... egyezzen a promptban lévő indexeléssel
        // ----------------------------
        const citations = retrievedChunks.map((c, i) => ({
            sourceIndex: i + 1,
            chunkId: String(c._id),
            subTopicId: String(c.subTopicId),
            title: c.title ?? "",
            score: c.score ?? null,
        }));

        // ----------------------------
        // 10) System + user prompt összerakása
        // ----------------------------
        const system = [
            "Te egy forrásalapú adózási asszisztens vagy.",
            "KIZÁRÓLAG a megadott FORRÁSOK tartalma alapján válaszolhatsz.",
            "Nem használhatsz külső tudást, háttérismeretet vagy feltételezést.",
            "",
            "Kötelező szabályok:",
            "- Csak olyan tényt/állítást írj le, ami a FORRÁSOKBAN szerepel, vagy azokból közvetlenül, szöveghűen összefoglalható.",
            "- A források több pontját összefűzheted és átfogalmazhatod, de nem találhatsz ki új információt és nem tehetsz hozzá új feltételeket.",
            "- Ha a FORRÁSOK csak részben válaszolnak: adj részválaszt, és sorold fel röviden, mi nem derül ki.",
            "- Ha a FORRÁSOK ellentmondanak: jelezd az ellentmondást, és mutasd meg mindkét állítást.",
            "- Ha nincs elég információ: írd pontosan ezt: „Nincs elég információ a forrásokban.”",
            "",
            "Válaszformátum (mindig tartsd):",
            "1) Válasz (1-3 mondat, tömören).",
            "2) Lényeg pontokba szedve.",
            "",
            "Stílus:",
            "- Magyarul válaszolj.",
            "- Röviden, tömören, jól tagolva.",
            "- Ahol lehet: felsorolás.",
            "- Kerüld a körmondatokat, mellébeszélést, és a jogi/adózási tanácsadás jellegű spekulációt."
        ].join("\n");


        const prompt = buildPromptFromChunks({
            question,
            history,
            chunks: retrievedChunks,
            // maxContextChars,
            // perChunkChars,
        });

        // ----------------------------
        // 11) LLM hívás
        // ----------------------------
        const resp = await client.responses.create({
            model: "gpt-5-mini",
            input: [
                { role: "system", content: system },
                { role: "user", content: prompt.user },
            ],
        });

        const answer = (resp.output_text || "").trim();
        const usage = resp?.usage ?? null

        // 12) Token könyvelés
        const usedNow = getTotalTokensFromUsage(usage);

        let after = before;

        if (!isAdmin) {

            if (usedNow > 0) {
                // atomikusan növeljük
                await User.updateOne({ _id: userId }, { $inc: { tokensUsed: usedNow } });
            }

            // friss állapot visszaadása (pontos)
            const userAfter = await User.findById(userId).select("tokenLimit tokensUsed").lean();
            after = normalizeTokenState(userAfter);
        } else {
            // admin: nem könyvelünk
            after = { limit: 50000, used: 0, remaining: 50000, isUnlimited: true };
        }

        // ----------------------------
        // 12) Return
        // ----------------------------
        return {
            ok: true,
            error: "",
            question,
            answer: answer || "Nincs elég információ a forrásokban.",
            citations,
            usage,
            token: after,
            debug: {
                usedContextChars: prompt.usedContextChars,
                usedContexts: prompt.usedContexts,
                topK,
                numCandidates,
                minScore,
                usedNow
                // maxContextChars,
                // perChunkChars,
            },
            responseId,
        };
    } catch (error) {
        console.error("ask rag action error", error);
        return {
            ok: false,
            error: "Hiba történt a kérdés feldolgozása során.",
            responseId,
            usage: null,
        };
    }


}


export async function getChunksByIdsAction(ids = []) {
    const session = await auth()
    if (!session?.user) return { ok: false, error: "Nincs jogosultságod.", chunks: [] }

    // védelem
    const safeIds = Array.isArray(ids) ? ids.filter(Boolean).slice(0, 10) : [] // max 10 egyszerre
    if (!safeIds.length) return { ok: true, error: "", chunks: [] }

    try {
        await connectToDatabase()

        const objectIds = safeIds.map((id) => new mongoose.Types.ObjectId(id))

        const rows = await Chunk.find({ _id: { $in: objectIds } })
            .select("_id subTopicId title text createdAt updatedAt")
            .lean()

        // tartsuk meg a kért sorrendet
        const map = new Map(rows.map((r) => [String(r._id), r]))
        const ordered = safeIds.map((id) => map.get(id)).filter(Boolean)

        return {
            ok: true,
            error: "",
            chunks: ordered.map((c) => ({
                id: String(c._id),
                subTopicId: String(c.subTopicId),
                title: c.title ?? "",
                text: c.text ?? "",
                createdAt: c.createdAt ?? null,
                updatedAt: c.updatedAt ?? null,
            })),
        }
    } catch (e) {
        console.error("getChunksByIdsAction error", e)
        return { ok: false, error: "Nem sikerült betölteni a forrásokat.", chunks: [] }
    }
}
