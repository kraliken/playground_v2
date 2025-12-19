// lib/database/connection/mongoose.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI nincs beállítva (.env.local)!");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const options = {
            serverApi: { version: "1", strict: false, deprecationErrors: true },
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
            console.log("✅ Connected to MongoDB");
            return mongoose;
        }).catch((err) => {
            console.error("❌ MongoDB connection error", err);
            throw err;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
