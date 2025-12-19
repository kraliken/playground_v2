import mongoose from "mongoose"

const ChunkSchema = new mongoose.Schema(
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

        // SECTION sorszám a dokumentumban
        chunkIndex: { type: Number, required: true },

        // pl. "### Bevezetés" -> "Bevezetés"
        sectionTitle: { type: String, default: "" },

        // A SECTION teljes szövege (nem erre keresünk, hanem a subchunkokra)
        text: { type: String, required: true },

        // citations/UI: rawText pozíció
        charStart: { type: Number, default: 0 },
        charEnd: { type: Number, default: 0 }, // exclusive
        charCount: { type: Number, default: 0 },

        preview: { type: String, default: "" },

        source: {
            originalFileName: { type: String, default: "" },
            documentTitle: { type: String, default: "" },
        },
    },
    { timestamps: true }
)

// Egy dokumentumon belül egy SECTION index egyszer
ChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true })

// Gyors listázás user/topic szerint
ChunkSchema.index({ uploadedByUserId: 1, createdAt: -1 })
ChunkSchema.index({ topicId: 1, createdAt: -1 })

export const Chunk = mongoose.models.Chunk || mongoose.model("Chunk", ChunkSchema)
