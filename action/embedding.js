"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import { Chunk } from "@/lib/database/models/Chunk";
import { SubTopic } from "@/lib/database/models/SubTopic";
import { revalidatePath } from "next/cache";
import OpenAI from "openai"

function getClient() {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error("Missing OPENAI_API_KEY")
    return new OpenAI({ apiKey: key })
}

export async function createEmbeddingAction(subTopicId) {

    // jogosultság
    const session = await auth();

    if (!session || session.user.role !== 'admin') return { ok: false, error: "Nincs jogosultságod.", message: "" };
    if (!subTopicId) return { ok: false, error: "Hiányzó altéma id" };

    console.log(subTopicId);

    try {
        await connectToDatabase();

        // lekérem a subtopicot
        const subTopic = await SubTopic.findOne({ _id: subTopicId })
            .select("_id status")
            .lean();

        // ellenőrzöm a státuszát
        // ha chunked, akkor mehet az embedding
        // ha failed, akkor megpróbáljuk újra
        if (subTopic.status !== "CHUNKED" && subTopic.status !== "FAILED") {
            return { ok: false, error: `Ebben az állapotban nem indítható embedding: ${doc.status}` }
        }

        // a subtopichoz tartozó chunkok lekérdezés
        // csak azokat kérjük le, amiknél nincs embedding
        const chunks = await Chunk.find({
            subTopicId,
            $or: [{ embedding: { $exists: false } }, { embedding: null }],
        })
            .select("_id text")
            .lean();

        if (!chunks.length) {
            // nincs mit embeddelni
            return { ok: true, error: "", message: "Nincs beágyazásra váró chunk." };
        }

        const batchSize = 64
        let totalTokens = 0;
        let embeddedCount = 0;
        const model = "text-embedding-3-small"

        const client = getClient();

        for (let start = 0; start < chunks.length; start += batchSize) {
            const batch = chunks.slice(start, start + batchSize);

            // a chunkok text értéke egy tömbben
            const input = batch.map((x) => x.text);

            const res = await client.embeddings.create({
                model,
                input
            });

            // létrehozunk egy tömböt, annyi elemmel, amennyi eleme volt az inputnak
            const embeddings = input.map(() => null);
            for (const d of res.data) embeddings[d.index] = d.embedding;

            totalTokens += res.usage.total_tokens;

            await SubTopic.updateOne(
                { _id: subTopicId },
                { $inc: { embeddingTotalTokens: totalTokens } }
            );

            // { prompt_tokens: 1877, total_tokens: 1877 }
            console.log(res.usage);

            // chunkok frissítése
            const ops = [];
            for (let i = 0; i < batch.length; i++) {
                const emb = embeddings?.[i];
                if (!emb) continue;

                ops.push({
                    updateOne: {
                        filter: { _id: batch[i]._id },
                        update: {
                            $set: {
                                embedding: emb,
                                embeddingModel: model,
                            },
                        },
                    },
                });
            }

            if (ops.length) {
                await Chunk.bulkWrite(ops);
                embeddedCount += ops.length;
            }

        }

        await SubTopic.updateOne(
            { _id: subTopicId },
            { $set: { status: "EMBEDDED" } }
        );

        revalidatePath("/dashboard/rag/docs");

        return { ok: true, error: "", message: "A beágyazás elkészült." }


    } catch (error) {
        console.error("create embeddings action error:", error);
        await SubTopic.updateOne(
            { _id: subTopicId },
            { $set: { status: "FAILED" } }
        );
        revalidatePath("/dashboard/rag/docs");
        return { ok: false, error: "Nem sikerült elindítani az embeddinget.", statusCode: 500 };

    }



}