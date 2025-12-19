// lib/actions/contents.js
"use server";

import { auth } from "../auth";
import { getUserIdOrResult } from "../auth/getUserIdOrResult";
import { connectToDatabase } from "../database/connection/mongoose";

import { Document } from "../database/models/Document";
import { Topic } from "../database/models/Topic";

export async function getMyDocumentsWithTopicAction() {
    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, statusCode: 401 };

    await connectToDatabase();

    const docs = await Document.find({ uploadedByUserId: authRes.userId })
        .select("_id title topicId status createdAt")
        .sort({ createdAt: -1 })
        .lean();

    const topicIds = [...new Set(docs.map((d) => String(d.topicId || "")).filter(Boolean))];

    const topics = await Topic.find({ _id: { $in: topicIds } })
        .select("_id name")
        .lean();

    const topicNameById = new Map(topics.map((t) => [String(t._id), t.name]));

    const documents = docs.map((d) => ({
        id: String(d._id),
        title: d.title || "(nincs cím)",
        topicId: String(d.topicId || ""),
        topicName: topicNameById.get(String(d.topicId)) || "(ismeretlen témakör)",
        status: d.status || "",
        isEmbedded: d.status === "EMBEDDED",
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
    }));

    return { ok: true, documents };
}
