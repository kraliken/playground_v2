import mongoose from "mongoose"

const DocumentSchema = new mongoose.Schema(
    {
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

        title: { type: String, required: true, trim: true, maxlength: 140 },
        sourceType: {
            type: String,
            required: true,
            enum: ["TEXTAREA", "TXT_UPLOAD", "URL"],
            default: "TXT_UPLOAD",
        },

        originalFileName: { type: String, trim: true, default: "" },
        mimeType: { type: String, trim: true, default: "text/plain" },
        sizeBytes: { type: Number, default: 0 },

        rawText: { type: String, required: true },

        status: {
            type: String,
            enum: ["UPLOADED", "CHUNKED", "EMBEDDED", "FAILED"],
            default: "UPLOADED",
        },
        errorMessage: { type: String, default: "" },

        // A te szerkesztési formátumod alapján:
        // ### ... ### = SECTION
        // #### ... #### = SUBCHUNK (szekción belül)
        chunking: {
            strategy: {
                type: String,
                enum: ["HEADING_HIERARCHY"],
                default: "HEADING_HIERARCHY",
            },
            sectionMarker: { type: String, default: "###" },
            subMarker: { type: String, default: "####" },
            includeMarkerLine: { type: Boolean, default: true },
        },
        embeddingTotalTokens: { type: Number, default: 0 },

        // opcionális, de később hasznos:
        embeddedAt: { type: Date },
    },
    { timestamps: true }
)

DocumentSchema.index({ uploadedByUserId: 1, createdAt: -1 })
DocumentSchema.index({ topicId: 1, uploadedByUserId: 1, createdAt: -1 })

// Hasznos lehet listázáshoz
DocumentSchema.index({ topicId: 1, createdAt: -1 })
DocumentSchema.index({ title: 1 })

export const Document =
    mongoose.models.Document || mongoose.model("Document", DocumentSchema)
