"use server"

import { getUserIdOrResult, auth } from "../auth";
import { connectToDatabase } from "../database/connection/mongoose";
import { Chunk } from "../database/models/Chunk";

export async function getChunksByTopicId(topicId) {

    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, topics: [], statusCode: 401 };

    try {

        await connectToDatabase();

        const chunks = await Chunk.find({ topicId })
            .select({ _id: 1, sectionTitle: 1 })
            .sort({ chunkIndex: 1 })
            .lean();

        return {
            ok: true,
            chunks: chunks.map((c) => ({
                id: String(c._id),
                title: c.sectionTitle?.trim()
            })),
        }

    } catch (e) {
        console.error("getChunksByTopicId error:", e)
        return {
            ok: false,
            error: "Nem sikerült lekérni a chunkokat.",
            chunks: [],
        }
    }

}