import mongoose from "mongoose"
import { connectToDatabase } from "../database/connection/mongoose"
import { Subchunk } from "../database/models/Subchunk"


export async function vectorSearchSubchunks({
    userId,
    topicId,
    queryVector,
    topK = 6,
    numCandidates = 80,
    indexName = "subchunks_embedding_index",
}) {
    await connectToDatabase()

    const topicObjectId = new mongoose.Types.ObjectId(topicId)

    // MongoDB Atlas Vector Search aggregation
    const pipeline = [
        {
            $vectorSearch: {
                index: indexName,
                path: "embedding",
                queryVector,
                numCandidates,
                limit: topK,
                filter: {
                    $and: [
                        { topicId: topicObjectId },
                    ],
                },
            },
        },
        {
            $addFields: {
                score: { $meta: "vectorSearchScore" },
            },
        },
        {
            $project: {
                _id: 1,
                score: 1,
                text: 1,
                preview: 1,

                topicId: 1,
                documentId: 1,
                chunkId: 1,
                chunkIndex: 1,
                subIndex: 1,
                subTitle: 1,

                uploadedByUserId: 1,
                uploadedByName: 1,

                source: 1,
                charStart: 1,
                charEnd: 1,
                charCount: 1,
                createdAt: 1,
            },
        },
    ]

    const results = await Subchunk.aggregate(pipeline)

    return results.map((r) => ({
        subchunkId: String(r._id),
        score: r.score,
        text: r.text,
        preview: r.preview,

        topicId: String(r.topicId),
        documentId: String(r.documentId),
        chunkId: String(r.chunkId),
        chunkIndex: r.chunkIndex,
        subIndex: r.subIndex,
        subTitle: r.subTitle || "",

        uploadedByUserId: String(r.uploadedByUserId),
        uploadedByName: r.uploadedByName || "",

        source: {
            documentTitle: r.source?.documentTitle || "",
            originalFileName: r.source?.originalFileName || "",
            sectionTitle: r.source?.sectionTitle || "",
        },

        charStart: r.charStart || 0,
        charEnd: r.charEnd || 0,
        charCount: r.charCount || (r.text ? r.text.length : 0),
    }))
}
