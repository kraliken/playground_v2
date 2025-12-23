// app/api/rag/chat/stream/route.js
import OpenAI from "openai"
import { NextResponse } from "next/server"
import { auth } from "@/auth" // nálad ez van a chat.js-ben is :contentReference[oaicite:3]{index=3}

export const runtime = "nodejs" // fontos: OpenAI SDK miatt

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function ndjson(controller, obj) {
    controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n"))
}

export async function POST(req) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ ok: false, error: "Nincs jogosultságod." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const question = (body?.question ?? "").trim()
    const topicId = body?.topicId ?? ""
    const subTopicId = body?.subTopicId ?? ""
    const chunkId = body?.chunkId ?? ""
    const chatHistory = Array.isArray(body?.chatHistory) ? body.chatHistory : []

    if (question.length < 4) {
        return NextResponse.json({ ok: false, error: "Túl rövid kérdés." }, { status: 400 })
    }

    // ✅ Teszt-implementáció: egyelőre csak a bemenő “kontextus stringet” várjuk a klienstől,
    // vagy később ide betesszük a chunkok DB-ből lekérését (ugyanaz a logika, mint askRagAction-ben).
    // A legkisebb változtatásos teszthez most átveszünk egy 'contextText' mezőt:
    const contextText = (body?.contextText ?? "").trim()

    const system = `Te egy magyar nyelvű asszisztens vagy. Ha van kontextus, azt használd. Ha nincs, jelezd őszintén.`

    // Chat history-ból minimal prompt (utolsó 6)
    const history = chatHistory.slice(-6).map(m => ({
        role: m.role,
        content: [{ type: "input_text", text: m.text }],
    }))

    const input = [
        { role: "system", content: [{ type: "input_text", text: system }] },
        ...history,
        ...(contextText
            ? [
                {
                    role: "user",
                    content: [{ type: "input_text", text: `KONTEXTUS:\n${contextText}` }],
                },
            ]
            : []),
        {
            role: "user",
            content: [{ type: "input_text", text: question }],
        },
    ]

    const stream = await client.responses.create({
        model: "gpt-5-mini", // vagy ami nálad van
        input,
        stream: true,
    })

    const readable = new ReadableStream({
        async start(controller) {
            try {
                // első meta event (hogy a kliens tudjon UI-t állítani)
                ndjson(controller, {
                    type: "meta",
                    payload: { topicId, subTopicId, chunkId },
                })

                for await (const event of stream) {
                    // a legfontosabb: text delta
                    if (event?.type === "response.output_text.delta") {
                        ndjson(controller, { type: "delta", delta: event.delta })
                    }

                    // completed: usage a végén
                    if (event?.type === "response.completed") {
                        ndjson(controller, { type: "done", usage: event.response?.usage ?? null })
                    }

                    // error
                    if (event?.type === "error") {
                        ndjson(controller, { type: "error", error: event.error?.message ?? "Ismeretlen hiba." })
                    }
                }
            } catch (e) {
                ndjson(controller, { type: "error", error: e?.message ?? "Ismeretlen hiba." })
            } finally {
                controller.close()
            }
        },
    })

    return new Response(readable, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no", // nginx esetén segít
        },
    })
}
