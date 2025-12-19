// lib/actions/embeddings.js
"use server";

import { revalidatePath } from "next/cache";

import { auth } from "../auth"; // nálad: lib/auth/index.js
import { getUserIdOrResult } from "../auth/getUserIdOrResult";
import { connectToDatabase } from "../database/connection/mongoose"; // vagy a nálad használt connect
import { embedDocumentSubchunks } from "../services/embeddings.service";

export async function embedDocumentAction(prevState, formData) {
    const authRes = await getUserIdOrResult(auth);
    if (!authRes.ok) return { ok: false, error: authRes.error, statusCode: 401 };

    const raw = Object.fromEntries(formData);
    const documentId = raw.documentId;

    if (!documentId) return { ok: false, error: "Hiányzó documentId.", statusCode: 400 };

    try {
        await connectToDatabase();

        const res = await embedDocumentSubchunks({
            documentId,
            userId: authRes.userId,
            model: "text-embedding-3-small",
            batchSize: 64,
        });

        if (!res.ok) return res;

        // ahol a listát / státuszt látod frissíteni (igazítsd a saját path-odra)
        revalidatePath("/dashboard/rag/topics");

        return { ok: true, embeddedCount: res.embeddedCount, totalTokens: res.totalTokens };
    } catch (error) {
        console.error("embedDocumentAction error:", error);
        return { ok: false, error: "Nem sikerült elindítani az embeddinget.", statusCode: 500 };
    }
}
