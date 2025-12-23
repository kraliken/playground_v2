import mongoose from "mongoose"

const ChunkSchema = new mongoose.Schema(
    {
        subTopicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubTopic",
            required: true,
            index: true,
        },
        uploadedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: { type: String, default: "" },
        text: { type: String, required: true },
        embedding: { type: [Number], default: undefined },
        embeddingModel: { type: String, default: "text-embedding-3-small" },
    },
    { timestamps: true }
)

export const Chunk = mongoose.models.Chunk || mongoose.model("Chunk", ChunkSchema)
