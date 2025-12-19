// lib/database/models/Topic.js
import mongoose from "mongoose"

const TopicSchema = new mongoose.Schema(
    {
        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },

        // slug: user-scoped unique (ugyanaz a slug mehet más usernél is)
        slug: { type: String, trim: true, lowercase: true },

        description: { type: String, trim: true, maxlength: 300, default: "" },
    },
    { timestamps: true }
)

// Egy useren belül legyen unique a slug
// TopicSchema.index({ createdByUserId: 1, slug: 1 }, { unique: true })

// Listázás/keresés
TopicSchema.index({ createdByUserId: 1, createdAt: -1 })
TopicSchema.index({ createdByUserId: 1, name: 1 })

export const Topic = mongoose.models.Topic || mongoose.model("Topic", TopicSchema)
