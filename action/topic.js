"use server"

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import { Chunk } from "@/lib/database/models/Chunk";
import { SubTopic } from "@/lib/database/models/SubTopic";
import { Topic } from "@/lib/database/models/Topic";
import { TopicSchema } from "@/lib/schemas/topic";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

// mappers -- start ------------------------------------------------------------------
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function toTopicDto(topic) {
    if (!topic || !topic._id) {
        throw new Error("Invalid topic: missing _id");
    }

    const dto = {
        id: String(topic._id),
    };

    if (hasOwn(topic, "title")) {
        dto.title = topic.title ?? "";
    }

    if (hasOwn(topic, "description")) {
        dto.description = topic.description ?? "";
    }

    if (hasOwn(topic, "createdAt")) {
        const createdAt = topic.createdAt;
        dto.createdAt =
            createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
    }

    return dto;
}

function toTopicDtos(topics) {
    if (!Array.isArray(topics)) {
        throw new Error("topics must be an array");
    }

    return topics.map(toTopicDto);
}

function toSubTopicsWithChunksDto(subTopicsRaw, chunksRaw) {
    const chunksBySubTopicId = new Map();

    for (const c of chunksRaw) {
        const key = String(c.subTopicId);
        if (!chunksBySubTopicId.has(key)) chunksBySubTopicId.set(key, []);
        chunksBySubTopicId.get(key).push({
            id: String(c._id),
            subTopicId: String(c.subTopicId),
            title: c.title ?? "",
            text: c.text ?? "",
            // embeddingModel: c.embeddingModel ?? "",
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
        });
    }

    return subTopicsRaw.map((s) => ({
        id: String(s._id),
        topicId: String(s.topicId),
        title: s.title ?? "",
        status: s.status ?? "",
        // embeddingTotalTokens: s.embeddingTotalTokens ?? 0,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
        chunks: chunksBySubTopicId.get(String(s._id)) ?? [],
    }));
}
// mappers -- end -------------------------------------------------------------------

// admin
export async function getAllTopicAction() {

    const session = await auth();

    if (!session.user || session.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    try {
        await connectToDatabase()

        const topics = await Topic.find({})
            .sort({ createdAt: -1 })
            .select("title description createdAt")
            .lean();

        return {
            ok: true,
            data: toTopicDtos(topics),
        }
    } catch (error) {
        console.error("get topic list action error", error)
        return { ok: false, error: "Server hiba", data: [] }
    }
}

// admi + user
export async function getAllTopicForSelectAction() {

    const session = await auth();

    if (!session.user) {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    try {
        await connectToDatabase()

        // 1) Kikeressük azokat a topicId-kat, amikhez van EMBEDDED subtopic
        const topicIds = await SubTopic.distinct("topicId", { status: "EMBEDDED" });

        const topics = await Topic.find({ _id: { $in: topicIds } })
            .sort({ title: -1 })
            .select("title")
            .lean();

        return {
            ok: true,
            data: toTopicDtos(topics),
        }
    } catch (error) {
        console.error("get topic list for select action error", error)
        return { ok: false, error: "Server hiba", data: [] }
    }
}

// admin + user
export async function getEmbeddedSubTopicsAndChunksByTopicAction(topicId) {
    const session = await auth();

    if (!session?.user) {
        return { ok: false, error: "Nincs jogosultságod.", data: [] };
    }

    if (!topicId) {
        return { ok: false, error: "Hiányzó topicId.", data: [] };
    }

    try {
        await connectToDatabase();

        const subTopicsRaw = await SubTopic.find(
            { topicId, status: "EMBEDDED" },
            { topicId: 1, title: 1, status: 1, createdAt: 1 }
        )
            .sort({ title: -1 })
            .lean();

        if (!subTopicsRaw.length) {
            return { ok: true, data: [] };
        }

        const subTopicIds = subTopicsRaw.map((s) => s._id);

        const chunksRaw = await Chunk.find(
            { subTopicId: { $in: subTopicIds } },
            { subTopicId: 1, title: 1, text: 1, createdAt: 1 }
        )
            .sort({ createdAt: -1 })
            .lean();

        return {
            ok: true,
            data: toSubTopicsWithChunksDto(subTopicsRaw, chunksRaw),
        };
    } catch (error) {
        console.error("getEmbeddedSubTopicsAndChunksByTopicAction error", error);
        return { ok: false, error: "Server hiba", data: [] };
    }
}

export async function getEmbeddedTree() {

    const session = await auth();

    if (!session.user) {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    try {
        await connectToDatabase()

        // 1) EMBEDDED subtopicok
        const subTopicsRaw = await SubTopic.find(
            {
                status: "EMBEDDED",
            },
            { topicId: 1, title: 1, status: 1, createdAt: 1, embeddingTotalTokens: 1 }
        )
            .sort({ createdAt: -1 })
            .lean();

        if (!subTopicsRaw.length) {
            return { ok: true, topics: [], subTopics: [], chunks: [] };
        }

        const subTopicIds = subTopicsRaw.map((s) => s._id);
        const topicIds = [...new Set(subTopicsRaw.map((s) => String(s.topicId)))];

        // 2) Topicok, amikhez van embedded subtopic
        const topicsRaw = await Topic.find(
            {
                _id: { $in: topicIds },
            },
            { title: 1, createdAt: 1 }
        )
            .sort({ createdAt: -1 })
            .lean();

        // 3) Chunkok, amik tényleg embeddelek (embedding tömb nem üres)
        const chunksRaw = await Chunk.find(
            {
                subTopicId: { $in: subTopicIds },
                $expr: { $gt: [{ $size: { $ifNull: ["$embedding", []] } }, 0] },
            },
            { subTopicId: 1, title: 1, createdAt: 1, embeddingModel: 1 }
        )
            .sort({ createdAt: -1 })
            .lean();

        // DTO (id-k stringgé)
        const topics = topicsRaw.map((t) => ({
            id: String(t._id),
            title: t.title ?? "",
            createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
        }));

        const subTopics = subTopicsRaw.map((s) => ({
            id: String(s._id),
            topicId: String(s.topicId),
            title: s.title ?? "",
            status: s.status ?? "",
            embeddingTotalTokens: s.embeddingTotalTokens ?? 0,
            createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
        }));

        const chunks = chunksRaw.map((c) => ({
            id: String(c._id),
            subTopicId: String(c.subTopicId),
            title: c.title ?? "",
            embeddingModel: c.embeddingModel ?? "",
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
        }));


        return { ok: true, topics, subTopics, chunks };

    } catch (error) {
        console.error("get embedded tree action error", error)
        return { ok: false, error: "Server hiba", data: [] }
    }
}

export async function getAllTopicWithSubTopicsAndChunksAction() {

    const session = await auth();

    if (!session || session.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    try {
        await connectToDatabase()

        const topics = await Topic.aggregate([
            { $sort: { createdAt: -1 } },
            { $project: { title: 1, createdAt: 1 } },

            {
                $lookup: {
                    from: SubTopic.collection.name,
                    let: { topicId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$topicId", "$$topicId"] } } },
                        { $project: { title: 1, status: 1, createdAt: 1, embeddingTotalTokens: { $ifNull: ["$embeddingTotalTokens", 0] } } },

                        // subtopic -> chunk statok (NEM listázunk chunkokat)
                        {
                            $lookup: {
                                from: Chunk.collection.name,
                                let: { subTopicId: "$_id" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$subTopicId", "$$subTopicId"] } } },
                                    {
                                        $group: {
                                            _id: null,
                                            chunkCount: { $sum: 1 },

                                            // non-embedded: embedding hiányzik / null / []
                                            nonEmbeddedCount: {
                                                $sum: {
                                                    $cond: [
                                                        { $eq: [{ $size: { $ifNull: ["$embedding", []] } }, 0] },
                                                        1,
                                                        0,
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                ],
                                as: "chunkStats",
                            },
                        },

                        // chunkStats -> mezők
                        {
                            $addFields: {
                                chunkCount: { $ifNull: [{ $first: "$chunkStats.chunkCount" }, 0] },
                                hasNonEmbeddedChunk: {
                                    $gt: [{ $ifNull: [{ $first: "$chunkStats.nonEmbeddedCount" }, 0] }, 0],
                                },
                            },
                        },

                        { $project: { chunkStats: 0 } },

                        { $sort: { createdAt: -1 } },
                    ],
                    as: "subTopics",
                },
            },

            // topic szintű összesítések
            {
                $addFields: {
                    subTopicCount: { $size: "$subTopics" },
                    chunkCount: { $sum: "$subTopics.chunkCount" },
                    subTopicsWithNonEmbeddedCount: {
                        $size: {
                            $filter: {
                                input: "$subTopics",
                                as: "s",
                                cond: "$$s.hasNonEmbeddedChunk",
                            },
                        },
                    },
                },
            },
        ])

        // DTO: id-k stringgé
        const dto = topics.map((t) => ({
            id: String(t._id),
            title: t.title ?? "",
            createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
            subTopicCount: t.subTopicCount ?? 0,
            chunkCount: t.chunkCount ?? 0,
            subTopicsWithNonEmbeddedCount: t.subTopicsWithNonEmbeddedCount ?? 0,
            subTopics: (t.subTopics ?? []).map((s) => ({
                id: String(s._id),
                title: s.title ?? "",
                status: s.status ?? "",
                chunkCount: s.chunkCount ?? 0,
                hasNonEmbeddedChunk: !!s.hasNonEmbeddedChunk,
                embeddingTotalTokens: s.embeddingTotalTokens ?? 0,
            })),
        }));

        return { ok: true, data: dto };

        // return {
        //     ok: true,
        //     data: toTopicDtos(topics),
        // }
    } catch (error) {
        console.error("get topic list action error", error)
        return { ok: false, error: "Server hiba", data: [] }
    }
}

export async function createTopicAction(prevState, formData) {

    // jogosultság
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    // zod validálás
    const rawFormData = Object.fromEntries(formData);
    const parsed = TopicSchema.safeParse(rawFormData)

    if (!parsed.success) {

        const fieldErrors = {};

        // Zod hibák feldolgozása
        parsed.error.issues.forEach((issue) => {
            const fieldName = issue.path[0]; // 'fullname' vagy 'email'

            // Csak az első hibát tároljuk mezőnként (mint a Mongoose)
            if (!fieldErrors[fieldName]) {
                fieldErrors[fieldName] = issue.message;
            }
        });

        return {
            ok: false,
            error: "Validációs hiba",
            errors: fieldErrors,
            data: rawFormData,
        };
    }

    const { title, description } = parsed.data

    try {

        await connectToDatabase()

        await Topic.create({
            createdByUserId: session.user.id,
            title,
            description: description || "",
        })

        revalidatePath("/dashboard/rag/topics")

        return { ok: true, error: "", message: "A témakör létrehozva.", data: {} }

    } catch (error) {
        console.error("create topic action error", error)
        const fieldErrors = {};

        // Mongoose validációs hiba
        if (error.name === "ValidationError") {

            for (const field in error.errors) {
                fieldErrors[field] = error.errors[field].message;
            }

            return {
                ok: false,
                error: "Validációs hiba",
                errors: fieldErrors,
                data: parsed.data,
            };
        }

        // Mongoose validációs hiba - már létező email
        if (error?.code === 11000) {


            const field = Object.keys(error.keyPattern)[0]; // 'email'

            const fieldErrors = {};
            fieldErrors[field] = `Ez az elnevezés már létezik.`;

            return {
                ok: false,
                error: "Validációs hiba",
                errors: fieldErrors,
                data: parsed.data
            };
        }

        return { ok: false, error: "Server hiba", errors: fieldErrors, data: parsed.data }

    }
}

export async function deleteTopicCascadeAction(topicId) {

    const session = await auth();

    if (!session || session.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
        };
    }

    if (!topicId) {
        return { ok: false, error: "Hiányzó topicId." };
    }

    let dbSession;

    try {
        await connectToDatabase();
        dbSession = await mongoose.startSession();

        let deletedTopic = null;
        let deletedSubTopicsCount = 0;
        let deletedChunksCount = 0;

        await dbSession.withTransaction(async () => {
            // 1) kikeressük a subtopicokat a topicId alapján
            const subTopics = await SubTopic.find({ topicId })
                .select("_id")
                .lean()
                .session(dbSession);

            const subTopicIds = subTopics.map((s) => s._id);

            // 2) chunkok törlése (ha vannak subtopicok)
            if (subTopicIds.length > 0) {
                const chunkRes = await Chunk.deleteMany({ subTopicId: { $in: subTopicIds } }).session(dbSession);
                deletedChunksCount = chunkRes.deletedCount ?? 0;
            }

            // 3) subtopicok törlése
            const subRes = await SubTopic.deleteMany({ topicId }).session(dbSession);
            deletedSubTopicsCount = subRes.deletedCount ?? 0;

            // 4) topic törlése
            const topicRes = await Topic.deleteOne({ _id: topicId }).session(dbSession);
            deletedTopic = (topicRes.deletedCount ?? 0) > 0;

            if (!deletedTopic) {
                // ha topic nem létezett, rollback
                throw new Error("A témakör nem található vagy már törölve lett.");
            }
        })

        revalidatePath("/dashboard/rag/topics");

        return {
            ok: true,
            message: `Témakör törölve. (${deletedSubTopicsCount} altéma, ${deletedChunksCount} chunk)`,
        };

    } catch (error) {
        console.error("delete topic cascade action error", error)
        return { ok: false, error: "Server hiba" }
    } finally {
        if (dbSession) dbSession.endSession();
    }

}