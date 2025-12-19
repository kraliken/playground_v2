// lib/services/embeddings.service.js
import { Document } from "../database/models/Document";
import { Subchunk } from "../database/models/Subchunk";
import { addEmbeddingUsageToDocument, markDocumentFailed } from "./documents.service";
import { embedTextsWithUsage } from "./openai"; // Feltételezés: itt van az OpenAI embedding hívás

function toObjectIdString(id) {
    return id ? String(id) : "";
}

function getTotalTokensFromUsage(usage) {
    // SDK-tól függően különböző lehet a shape
    if (!usage) return 0;
    if (typeof usage.total_tokens === "number") return usage.total_tokens;
    if (typeof usage.prompt_tokens === "number") return usage.prompt_tokens;
    return 0;
}

export async function embedDocumentSubchunks({
    documentId,
    userId,
    model = "text-embedding-3-small",
    batchSize = 64,
}) {
    if (!documentId) throw new Error("documentId is required");
    if (!userId) throw new Error("userId is required");

    // 1) Jogosultság: a document a useré?
    const doc = await Document.findOne({ _id: documentId, uploadedByUserId: userId })
        .select("_id status")
        .lean();

    if (!doc) {
        return { ok: false, error: "Nincs jogosultság ehhez a dokumentumhoz." };
    }

    // 2) Csak akkor embedeljünk, ha van mit (CHUNKED), vagy ha újra próbáljuk FAILED után
    // (Ha nálad más státusz logika kell, itt igazítsd.)
    if (doc.status !== "CHUNKED" && doc.status !== "FAILED") {
        // EMBEDDED esetén is futhatna újra, de akkor duplázódhat token usage.
        // Itt inkább védünk.
        return { ok: false, error: `Ebben az állapotban nem indítható embedding: ${doc.status}` };
    }

    // 3) Csak azok a subchunkok, amiknek még nincs embeddingjük
    // embedding: undefined / null eseteket fedjük
    const subchunks = await Subchunk.find({
        documentId,
        $or: [{ embedding: { $exists: false } }, { embedding: null }],
    })
        .select("_id text")
        .lean();

    if (!subchunks.length) {
        // nincs mit embedelni
        return { ok: true, documentId: toObjectIdString(documentId), embeddedCount: 0, totalTokens: 0 };
    }

    // 4) Batch embedding + bulkWrite
    let embeddedCount = 0;
    let totalTokens = 0;

    try {
        for (let start = 0; start < subchunks.length; start += batchSize) {
            const batch = subchunks.slice(start, start + batchSize);

            // Texts – fontos: a sorrend maradjon, index-alapú update lesz
            const texts = batch.map((x) => x.text);

            const { embeddings, usage } = await embedTextsWithUsage(texts, { model });
            const used = getTotalTokensFromUsage(usage);
            totalTokens += used;

            // increment document usage (batch-enként)
            if (used) {
                await addEmbeddingUsageToDocument(documentId, { totalTokens: used });
            }

            // Bulk update: csak azokhoz írunk, ahol van embedding
            const ops = [];
            for (let i = 0; i < batch.length; i++) {
                const emb = embeddings?.[i];
                if (!emb) continue;

                ops.push({
                    updateOne: {
                        filter: { _id: batch[i]._id },
                        update: {
                            $set: {
                                embedding: emb,
                                embeddingModel: model,
                            },
                        },
                    },
                });
            }

            if (ops.length) {
                await Subchunk.bulkWrite(ops);
                embeddedCount += ops.length;
            }
        }

        // 5) Document státusz frissítés
        await Document.updateOne(
            { _id: documentId },
            { $set: { status: "EMBEDDED", errorMessage: "", embeddedAt: new Date() } }
        );

        return {
            ok: true,
            documentId: toObjectIdString(documentId),
            embeddedCount,
            totalTokens,
        };
    } catch (error) {
        // Document FAILED + message
        await markDocumentFailed(documentId, "Feldolgozás/embedding hiba.");
        return { ok: false, error: "Feldolgozás/embedding hiba." };
    }
}
