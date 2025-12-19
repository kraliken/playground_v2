import mongoose from "mongoose"

const SubchunkSchema = new mongoose.Schema(
    {
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true,
            index: true,
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: true,
            index: true,
        },

        uploadedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        uploadedByName: { type: String, default: "" },

        // Parent SECTION
        chunkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chunk",
            required: true,
            index: true,
        },
        chunkIndex: { type: Number, required: true }, // parent section index (UI-hoz gyors)
        subIndex: { type: Number, required: true },   // subchunk index a sectionön belül

        // pl. "#### Telepítés" -> "Telepítés"
        subTitle: { type: String, default: "" },

        text: { type: String, required: true },

        charStart: { type: Number, default: 0 },
        charEnd: { type: Number, default: 0 }, // exclusive
        charCount: { type: Number, default: 0 },

        preview: { type: String, default: "" },

        embeddingModel: { type: String, default: "text-embedding-3-small" },

        // IMPORTANT: erre készül az Atlas Vector Search index
        embedding: { type: [Number], default: undefined },

        // UI-hoz/citationshez denormalizált meta
        source: {
            originalFileName: { type: String, default: "" },
            documentTitle: { type: String, default: "" },
            sectionTitle: { type: String, default: "" },
        },
    },
    { timestamps: true }
)

// Egy SECTION-on belül egy SUB index egyszer
SubchunkSchema.index({ chunkId: 1, subIndex: 1 }, { unique: true })

// Gyors listázás
SubchunkSchema.index({ uploadedByUserId: 1, createdAt: -1 })
SubchunkSchema.index({ topicId: 1, createdAt: -1 })
SubchunkSchema.index({ documentId: 1, createdAt: -1 })

export const Subchunk =
    mongoose.models.Subchunk || mongoose.model("Subchunk", SubchunkSchema)
