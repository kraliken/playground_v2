import { Document } from "../database/models/Document";

export async function createDocumentFromTxtUpload({
    topicId,
    userId,
    userName,
    file,
    chunking
}) {
    if (!topicId) throw new Error("topicId is required");
    if (!userId) throw new Error("userId is required");
    if (!file || typeof file.text !== "function") throw new Error("file is required");

    // Feltételezés: max 2MB, csak text/plain
    if (file.size && file.size > 2 * 1024 * 1024) {
        return { ok: false, error: "A fájl túl nagy (max 2MB)." };
    }
    if (file.type && file.type !== "text/plain") {
        return { ok: false, error: "Csak .txt (text/plain) fájl tölthető fel." };
    }

    const rawText = await file.text();
    const title = file.name || "Feltöltött dokumentum";

    const document = await Document.create({
        topicId,
        uploadedByUserId: userId,
        uploadedByName: userName,
        title,
        sourceType: "TXT_UPLOAD",
        originalFileName: file.name || "",
        mimeType: file.type || "text/plain",
        sizeBytes: file.size || 0,
        rawText,
        status: "UPLOADED",
        chunking: {
            strategy: "HEADING_HIERARCHY",
            sectionMarker: chunking?.sectionMarker || "###",
            subMarker: chunking?.subMarker || "####",
            includeMarkerLine: chunking?.includeMarkerLine ?? true,
        },
    });

    return { ok: true, document, rawText };
}

export async function markDocumentFailed(documentId, message) {
    await Document.updateOne(
        { _id: documentId },
        { $set: { status: "FAILED", errorMessage: message } }
    );
}

export async function markDocumentChunked(documentId, { chunkCount = 0, subchunkCount = 0 } = {}) {
    await Document.updateOne(
        { _id: documentId },
        { $set: { status: "CHUNKED", chunkCount, subchunkCount } }
    );
}


export async function addEmbeddingUsageToDocument(documentId, { totalTokens = 0 } = {}) {
    if (!totalTokens) return;
    await Document.updateOne(
        { _id: documentId },
        { $inc: { embeddingTotalTokens: totalTokens } }
    );
}

