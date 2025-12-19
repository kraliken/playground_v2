import OpenAI from "openai"

function getClient() {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error("Missing OPENAI_API_KEY")
    return new OpenAI({ apiKey: key })
}

export async function embedTexts(texts, { model = "text-embedding-3-small" } = {}) {
    const client = getClient()

    // Basic sanitization / length guard (MVP)
    const input = texts
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .map((t) => (t.length > 8000 ? t.slice(0, 8000) : t)) // durva limit (később finomítjuk)

    if (!input.length) return []

    const res = await client.embeddings.create({
        model,
        input,
    })

    // res.data: [{ embedding: number[], index: ... }, ...]
    return res.data.map((d) => d.embedding)
}

/**
 * Chat answer helper (RAG).
 * - model: gpt-5-mini
 * - We use Responses API if available; fallback to Chat Completions.
 */
export async function chatAnswer({
    model = "gpt-5-mini",
    system,
    user,
}) {
    const client = getClient()

    // Prefer Responses API (newer), fallback if not available.
    if (client.responses && typeof client.responses.create === "function") {
        const resp = await client.responses.create({
            model,
            // temperature,
            input: [
                system ? { role: "system", content: system } : null,
                { role: "user", content: user },
            ].filter(Boolean),
        })

        // Try best-effort text extraction
        const text =
            resp.output_text ||
            (Array.isArray(resp.output)
                ? resp.output
                    .flatMap((o) => o.content || [])
                    .map((c) => c.text)
                    .filter(Boolean)
                    .join("\n")
                : "")

        return { text: (text || "").trim(), raw: resp }
    }

    // Fallback: Chat Completions
    const cc = await client.chat.completions.create({
        model,
        // temperature,
        messages: [
            system ? { role: "system", content: system } : null,
            { role: "user", content: user },
        ].filter(Boolean),
    })

    const text = cc.choices?.[0]?.message?.content || ""
    return { text: text.trim(), raw: cc }
}

