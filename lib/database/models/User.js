import mongoose from "mongoose";

const { Schema } = mongoose;

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "A név megadása kötelező."],
            trim: true,
            minlength: [4, "A név legalább 4 karakter hosszú legyen."],
        },

        email: {
            type: String,
            required: [true, "Az email cím megadása kötelező."],
            trim: true,
            lowercase: true,
            unique: true,
            match: [EMAIL_REGEX, "Érvénytelen email formátum."],
        },
        image: {
            type: String,
            trim: true,
        },
        emailVerified: {
            type: Boolean,
        },

        hashedPassword: {
            type: String,
            required: [true, "A hashelt jelszó létrehozása kötelező."],
            select: false, // biztonsági best practice
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        mustChangePassword: {
            type: Boolean,
            default: true,
        },

        passwordChangedAt: {
            type: Date,
        },
        tokenLimit: {
            type: Number,
            default: 50000,
            min: 0,
        },
        tokensUsed: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        // toJSON: {
        //     transform: function (doc, ret) {
        //         ret.id = ret._id?.toString();
        //         delete ret._id;
        //         delete ret.__v;
        //         delete ret.hashedPassword;
        //         return ret;
        //     }
        // },
        // toObject: {
        //     transform: function (doc, ret) {
        //         ret.id = ret._id?.toString();
        //         delete ret._id;
        //         delete ret.__v;
        //         delete ret.hashedPassword;
        //         return ret;
        //     },
        // },
    }
);

// Best practice: email mező indexelése (unique index).
// - A unique: true automatikusan indexet hoz létre, de explicit megadni is szokás.
// - Ez segít gyorsabban keresni email alapján és enforce-olni az egyediséget.
// UserSchema.index({ email: 1 }, { unique: true });

UserSchema.pre("save", function () {
    // ha a passwordHash nem változott, nem csinálunk semmit
    if (!this.isModified("hashedPassword")) {
        return
    }

    if (!this.isNew) {
        // csak tényleges jelszócsere esetén állítjuk be
        this.passwordChangedAt = new Date();
        this.mustChangePassword = false;
    }
});

// Model létrehozása:
// - mongoose.model("User", UserSchema)
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
