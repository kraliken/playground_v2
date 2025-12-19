import OpenAI from "openai"

function getClient() {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error("Missing OPENAI_API_KEY")
    return new OpenAI({ apiKey: key })
}

export async function embedTextsWithUsage(texts, { model = "text-embedding-3-small" } = {}) {
    const client = getClient();

    const input = (texts || []).map((t) => {
        const s = typeof t === "string" ? t.trim() : "";
        return s.length > 8000 ? s.slice(0, 8000) : s;
    });

    const hasAny = input.some((x) => x.length > 0);
    if (!hasAny) return { embeddings: input.map(() => null), usage: null };

    const res = await client.embeddings.create({ model, input });

    const embeddings = input.map(() => null);
    for (const d of res.data) embeddings[d.index] = d.embedding;

    return { embeddings, usage: res.usage || null };
}

function clamp(str, max) {
    const s = String(str || "")
    if (s.length <= max) return s
    return s.slice(0, max)
}

export function buildRagPrompt({
    question,
    contexts,
    maxContextChars = 9000, // összes context budget (MVP)
    perChunkChars = 3800,   // egy chunk maximum ennyi karaktert adhat a promptba
}) {
    const safeQuestion = clamp(question, 1200).trim()

    const system = [
        `Te egy forrásalapú asszisztens vagy.
        KIZÁRÓLAG a megadott FORRÁSOK tartalma alapján válaszolhatsz.
        Tilos bármilyen külső tudás, általános háttérismeret vagy „józan ész szerinti” kiegészítés használata.
        Szabályok:
            - Csak olyan állítást tehetsz, amely egyértelműen megtalálható a FORRÁSOKBAN.
            - Több forrás együttes értelmezése megengedett, de következtetést nem vonhatsz le.
            - Ha a FORRÁSOK csak részben adnak választ, adj részleges választ, és egyértelműen jelezd, mi hiányzik.
            - Ha a FORRÁSOK egymásnak ellentmondanak, ezt külön jelezd.
            - Ha nincs elegendő információ, mondd pontosan ezt: „Nincs elég információ a forrásokban.”
        Stílus:
            - Magyarul válaszolj.
            - Laikus felhasználó számára érthetően fogalmazz.
            - Törekedj rövid, tömör, könnyen áttekinthető válaszra.
            - A formázást(bekezdés, felsorolás) a válasz hossza és tartalma alapján válaszd meg.
            - Ne írj felesleges magyarázatot vagy körítést.`

    ].join("\n")

    let used = 0
    const blocks = []

    for (let i = 0; i < (contexts || []).length; i++) {
        const c = contexts[i]
        const label = `[${i + 1}]`
        const headerParts = [
            c.source?.documentTitle ? `Doksi: ${c.source.documentTitle}` : null,
            c.source?.sectionTitle ? `### ${c.source.sectionTitle}` : null,
            c.subTitle ? `#### ${c.subTitle}` : null,
            c.uploadedByName ? `Feltöltő: ${c.uploadedByName}` : null,
        ].filter(Boolean)

        const header = headerParts.length ? `(${headerParts.join(" | ")})` : ""
        const body = clamp(c.text || c.preview || "", perChunkChars).trim()

        const block = `${label} ${header}\n${body}`
        const blockLen = block.length + 2

        if (used + blockLen > maxContextChars) break
        used += blockLen
        blocks.push(block)
    }

    const contextText = blocks.length
        ? `FORRÁSOK:\n\n${blocks.join("\n\n")}`
        : "FORRÁSOK:\n\n(nincs találat)"

    const user = [
        contextText,
        "",
        `KÉRDÉS:\n${safeQuestion}`,
        "",
        "KÉRÉS:",
        `- A választ kizárólag a FORRÁSOK alapján add meg.
            - Ne használj külső tudást vagy általános magyarázatot.
            - Ha a válasz csak részben adható meg, jelezd egyértelműen, mi hiányzik.
            - Ha a források egymásnak ellentmondanak, ezt külön említsd meg.
            - A választ röviden, tömören, laikus számára érthetően fogalmazd meg.`,
    ].join("\n")

    return { system, user, usedContextChars: used, usedContexts: blocks.length }
}
