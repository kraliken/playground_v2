// lib/database/models/Topic.js
import mongoose from "mongoose"

const TopicSchema = new mongoose.Schema(
    {
        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Felhasználó id kötelező."],
            index: true,
        },

        title: {
            type: String,
            required: [true, "Az elnevezés megadása kötelező."],
            unique: true,
            trim: true,
            minlength: [3, "Az elnevezés legalább 3 karakter hosszú legyen."],
            maxlength: [80, "Az elnevezés maximum 80 karakter hosszú legyen."]
        },

        description: {
            type: String,
            trim: true,
            maxlength: [300, "A leírás maximum 300 karakter hosszú legyen."],
            default: ""
        },
    },
    { timestamps: true }
)


export const Topic = mongoose.models.Topic || mongoose.model("Topic", TopicSchema)
