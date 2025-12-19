import { Chunk } from "../database/models/Chunk";
import { Subchunk } from "../database/models/Subchunk";
import { parseHeadingHierarchy } from "../utils/chunking";
import { estimateTokensFromChars } from "../utils/tokenEstimate";
import { markDocumentChunked, markDocumentFailed } from "./documents.service";

function normalizeSubchunksForSection(section) {
    // Ha nincs ####, akkor 1 subchunk a teljes section text-ből
    if (section?.subchunks?.length) return section.subchunks;

    return [{
        subIndex: 0,
        subTitle: "",
        text: section.text,
        charStart: section.charStart,
        charEnd: section.charEnd,
        preview: (section.text || "").slice(0, 240),
    }];
}

export async function createChunksAndSubchunksForDocumentFromRawText({
    rawText,
    document,
    topicId,
    userId,
    uploadedByName,
    originalFileName,
    embeddingModel = "text-embedding-3-small",
}) {
    const cfg = {
        sectionMarker: document.chunking?.sectionMarker || "###",
        subMarker: document.chunking?.subMarker || "####",
        includeMarkerLine: document.chunking?.includeMarkerLine !== false,
    };

    const sections = parseHeadingHierarchy(rawText, cfg);

    if (!sections.length) {
        const msg = `Nem található feldolgozható szekció (${cfg.sectionMarker}).`;
        await markDocumentFailed(document._id, msg);
        return { ok: false, error: msg, insertedCount: 0 };
    }

    // 1) Chunks
    const chunkDocs = sections.map((s, i) => ({
        documentId: document._id,
        topicId,
        uploadedByUserId: userId,
        uploadedByName,
        chunkIndex: i,
        sectionTitle: s.sectionTitle || `Szekció ${i + 1}`,
        text: s.text,
        charStart: s.charStart || 0,
        charEnd: s.charEnd || 0,
        charCount: (s.text || "").length,
        preview: (s.text || "").slice(0, 240),
        source: {
            originalFileName: originalFileName || "",
            documentTitle: document.title,
        },
    }));

    const insertedChunks = await Chunk.insertMany(chunkDocs, { ordered: false });
    const chunkIdByIndex = new Map(insertedChunks.map((c) => [c.chunkIndex, c._id]));

    // 2) Subchunks
    const subchunkDocs = [];
    for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const chunkId = chunkIdByIndex.get(i);

        // Safety: ha nincs chunkId (valamiért), inkább fail-eljünk konzisztensen
        if (!chunkId) {
            const msg = `Chunk ID hiányzik (chunkIndex: ${i}).`;
            await markDocumentFailed(document._id, msg);
            return { ok: false, error: msg, chunkCount: insertedChunks.length, subchunkCount: 0 };
        }

        const subs = normalizeSubchunksForSection(s);
        for (let j = 0; j < subs.length; j++) {
            const sub = subs[j];
            const subText = String(sub.text || "").trim();
            if (!subText) continue;

            subchunkDocs.push({
                documentId: document._id,
                topicId,
                uploadedByUserId: userId,
                uploadedByName,

                chunkId,
                chunkIndex: i,
                subIndex: j,

                subTitle: sub.subTitle || "",
                text: subText,

                charStart: sub.charStart || 0,
                charEnd: sub.charEnd || 0,
                charCount: subText.length,
                tokenCountEstimate: estimateTokensFromChars(subText),
                preview: subText.slice(0, 240),

                embeddingModel,
                embedding: undefined,

                source: {
                    originalFileName: originalFileName || "",
                    documentTitle: document.title,
                    sectionTitle: s.sectionTitle || `Szekció ${i + 1}`,
                },
            });
        }
    }

    const insertedSubs = await Subchunk.insertMany(subchunkDocs, { ordered: false });

    await markDocumentChunked(document._id, {
        chunkCount: insertedChunks.length,
        subchunkCount: insertedSubs.length,
    });

    return {
        ok: true,
        chunkCount: insertedChunks.length,
        subchunkCount: insertedSubs.length,
    };
}