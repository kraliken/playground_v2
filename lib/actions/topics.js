// lib/actions/topic.js
"use server"

import { connectToDatabase } from "../database/connection/mongoose";
import { createTopic, getTopicByIdForUser, listTopicsByUserId } from "../services/topics.service";
import { toTopicDtos } from "../mappers/topic";
import { auth, getUserIdOrResult } from "../auth";
import { CreateTopicSchema } from "../schemas/topic.schemas";
import { revalidatePath } from "next/cache";
import { TXTUploadSchema } from "../schemas/upload.txt.schemas";
import { createDocumentFromTxtUpload } from "../services/documents.service";
import { createChunksAndSubchunksForDocumentFromRawText } from "../services/chunks.service";
import { Topic } from "../database/models/Topic";
import mongoose from "mongoose";
import { Subchunk } from "../database/models/Subchunk";
import { Chunk } from "../database/models/Chunk";
import { Document } from "../database/models/Document";

export async function getTopicListAction() {

    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, topics: [], statusCode: 401 };

    const userId = authRes.userId;

    try {

        await connectToDatabase()

        const topics = await listTopicsByUserId(userId);

        return {
            ok: true,
            topics: toTopicDtos(topics),
        }

    } catch (e) {
        console.error("getTopicListAction error:", e)
        return {
            ok: false,
            error: "Nem sikerült lekérni a témaköröket.",
            topics: [],
        }
    }
}

export async function getAllTopicAction() {

    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, topics: [], statusCode: 401 };

    const userId = authRes.userId;

    try {

        await connectToDatabase()

        // kiszervezni service-be
        const topics = await Topic.find({})
            .select({ _id: 1, name: 1 })
            .sort({ name: 1 })
            .lean();

        return {
            ok: true,
            topics: toTopicDtos(topics),
        }

    } catch (e) {
        console.error("getTopicListAction error:", e)
        return {
            ok: false,
            error: "Nem sikerült lekérni a témaköröket.",
            topics: [],
        }
    }
}

export async function createTopicAction(prevState, formData) {

    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, statusCode: 401 };
    const userId = authRes.userId;

    const rawFormData = Object.fromEntries(formData);

    const parsed = CreateTopicSchema.safeParse(rawFormData)

    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message || "Hibás adatok.", data: rawFormData }
    }

    try {

        await connectToDatabase()

        const res = await createTopic({
            userId,
            name: parsed.data.name,
            description: parsed.data.description,
        })

        revalidatePath("/dashboard/rag/topics")

        return { ok: true, ...res }

    } catch (e) {
        console.error("createTopicAction error:", e)

        if (e?.code === 11000) {
            return { ok: false, error: "Már létezik ilyen témakör.", data: rawFormData }
        }

        return { ok: false, error: "Nem sikerült létrehozni a témakört.", data: rawFormData }
    }
}

export async function uploadTxtToTopicAction(prevState, formData) {

    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, statusCode: 401 };
    const userId = authRes.userId;

    const rawFormData = Object.fromEntries(formData);
    // console.log("rawFormData: ", rawFormData);

    const parsed = TXTUploadSchema.safeParse(rawFormData)

    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message || "Hibás adatok.", data: rawFormData }
    }

    try {
        await connectToDatabase()

        const topic = await getTopicByIdForUser({ topicId: parsed.data.topicId, userId });
        if (!topic) return { ok: false, error: "Nincs jogosultság ehhez a témakörhez." };

        const { document, rawText } = await createDocumentFromTxtUpload({
            topicId: topic._id,
            userId: authRes.userId,
            userName: authRes.userName,
            file: rawFormData.file,
        });

        const chunkRes = await createChunksAndSubchunksForDocumentFromRawText({
            rawText,
            document,
            topicId: topic._id,
            userId: authRes.userId,
            uploadedByName: authRes.userName,
            originalFileName: rawFormData.file?.name,
        });

        if (!chunkRes.ok) return { ok: false, error: chunkRes.error };

        return {
            ok: true,
            documentId: String(document._id),
            insertedChunks: chunkRes.chunkCount,
            insertedSubchunks: chunkRes.subchunkCount,
        };


    } catch (error) {
        console.error("uploadTxtToTopicAction error:", error);
        return { ok: false, error: "Nem sikerült feltölteni a dokumentumot." };
    }

}

export async function deleteTopicCascadeAction(id) {

    console.log(id);
    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, statusCode: 401 };
    const userId = authRes.userId;

    const topicId = new mongoose.Types.ObjectId(id?.topicId);

    try {
        await connectToDatabase();

        const topic = await Topic.findOne({ _id: topicId, createdByUserId: userId })
            .select({ _id: 1, name: 1 })
            .lean();

        if (!topic) {
            return { ok: false, message: "A témakör nem található, vagy nincs hozzá jogosultságod." };
        }

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // 1) Subchunkok törlése (topic + user)
                await Subchunk.deleteMany({ topicId, uploadedByUserId: userId }).session(session);

                // 2) Chunkok törlése (topic + user)
                await Chunk.deleteMany({ topicId, uploadedByUserId: userId }).session(session);

                // 3) Documentek törlése (topic + user)
                await Document.deleteMany({ topicId, uploadedByUserId: userId }).session(session);

                // 4) Topic törlése (owner alapján)
                await Topic.deleteOne({ _id: topicId, createdByUserId: userId }).session(session);
            });
        } finally {
            session.endSession();
        }

        revalidatePath("/dashboard/rag/topics");

        return {
            ok: true,
            message: `Témakör törölve: ${topic.name}`,
            data: { topicId: String(topicId) },
        };
    } catch (error) {
        // Szerveren logolunk értelmesen, kliensnek nem adjuk át nyersen
        console.error("deleteTopicCascadeAction error:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            stack: error?.stack,
        });

        return {
            ok: false,
            message: "Nem sikerült törölni a témakört. Próbáld újra később.",
        };
    }
}