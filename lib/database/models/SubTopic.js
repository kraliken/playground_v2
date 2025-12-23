// lib/database/models/Topic.js
import mongoose from "mongoose"

const SubTopicSchema = new mongoose.Schema(
    {
        uploadedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Felhasználó id kötelező."],
            index: true,
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: [true, "Topic id kötelező."],
            index: true,
        },

        title: {
            type: String,
            required: [true, "Az elnevezés megadása kötelező."],
            unique: true,
            trim: true,
            minlength: [3, "Az altéma legalább 3 karakter hosszú legyen."],
            maxlength: [300, "Az altéma maximum 300 karakter hosszú legyen."]
        },
        originalFileName: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["UPLOADED", "CHUNKED", "EMBEDDED", "FAILED"],
            default: "UPLOADED",
        },
        embeddingTotalTokens: { type: Number, default: 0 },

    },
    { timestamps: true }
)


export const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic", SubTopicSchema)
