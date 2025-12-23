"use server"

import mongoose from "mongoose";
import { auth } from "@/auth";
import { Chunk } from "@/lib/database/models/Chunk";
import { SubTopic } from "@/lib/database/models/SubTopic";
import { ContentSchema } from "@/lib/schemas/content";

function stripHeading(line, marker) {
    // "## Cím" -> "Cím"
    return line.trim().slice(marker.length).trim();
}
export async function uploadContentAction(prevState, formData) {
    // jogosultság
    const authSession = await auth();

    if (!authSession || authSession.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    // zod validálás
    const rawFormData = Object.fromEntries(formData);
    const parsed = ContentSchema.safeParse(rawFormData)

    if (!parsed.success) {

        const fieldErrors = {};

        // Zod hibák feldolgozása
        parsed.error.issues.forEach((issue) => {
            const fieldName = issue.path[0]; // 'fullname' vagy 'email'

            // Csak az első hibát tároljuk mezőnként (mint a Mongoose)
            if (!fieldErrors[fieldName]) {
                fieldErrors[fieldName] = issue.message;
            }
        });


        return {
            ok: false,
            error: "Validációs hiba",
            errors: fieldErrors,
            data: rawFormData,
        };
    }

    const { topicId, file } = parsed.data

    try {

        // fájl feldolgozása
        const rawText = await file.text();
        const originalFileName = file.name || "Feltöltött dokumentum";

        const text = String(rawText || "");
        const lines = text.split(/\r?\n/);

        const subTopics = [];

        const subTopicMarker = "##"
        const chunkMarker = "###"

        const isSubTopic = (line) => line.trim().startsWith(subTopicMarker + " ");
        const isChunk = (line) => line.trim().startsWith(chunkMarker + " ");

        let currentSubTopic = null;
        let currentChunk = null;
        let keepEmptyChunks = false

        const flushChunk = () => {
            if (!currentSubTopic || !currentChunk) return;

            currentChunk.content = currentChunk._lines.join("\n").trim();
            delete currentChunk._lines;

            if (keepEmptyChunks || currentChunk.content.length > 0) {
                currentSubTopic.chunks.push(currentChunk);
            }
            currentChunk = null;
        };

        const flushSubTopic = () => {
            if (!currentSubTopic) return;

            flushChunk();

            delete currentSubTopic._introLines;

            // ha nincs se intro se chunk, akkor dobd
            const hasAnyContent = currentSubTopic.chunks.some((c) => c.content && c.content.trim().length > 0);

            if (hasAnyContent) subTopics.push(currentSubTopic);
            currentSubTopic = null;
        };

        for (const line of lines) {
            if (isSubTopic(line)) {
                flushSubTopic();
                currentSubTopic = {
                    title: stripHeading(line, subTopicMarker),
                    chunks: [],
                    _introLines: [],
                };
                continue;
            }

            // subTopic nélkül nem gyűjtünk semmit
            if (!currentSubTopic) continue;

            if (isChunk(line)) {
                flushChunk();
                currentChunk = {
                    title: stripHeading(line, chunkMarker),
                    content: "",
                    _lines: [],
                };
                continue;
            }

            // sima szövegsor: vagy chunk content, vagy subTopic intro
            if (currentChunk) currentChunk._lines.push(line);
            else currentSubTopic._introLines.push(line);
        }

        flushSubTopic();

        // a kinyert szöveget elmentjük
        const dbSession = await mongoose.startSession();

        const results = [];

        try {

            await dbSession.withTransaction(async () => {
                for (const st of subTopics) {
                    const subTopicTitle = String(st?.title ?? "").trim();
                    if (subTopicTitle.length < 3) {
                        // a schema is dobna, de így érthetőbb üzenetet adsz
                        throw new Error(`Érvénytelen SubTopic title: "${subTopicTitle}"`);
                    }

                    // 1) SubTopic create
                    let createdSubTopic;

                    [createdSubTopic] = await SubTopic.create(
                        [
                            {
                                uploadedByUserId: authSession.user.id,
                                topicId,
                                title: subTopicTitle,
                                originalFileName: originalFileName || "",
                                status: "CHUNKED",
                            },
                        ],
                        { dbSession }
                    );


                    // 2) Chunk insertMany
                    const chunkDocs = (st?.chunks ?? [])
                        .map((c) => {
                            const title = String(c?.title ?? "").trim();
                            const text = String(c?.content ?? "").trim();

                            // Chunk.text required a sémában :contentReference[oaicite:3]{index=3}
                            if (!text) return null;

                            return {
                                subTopicId: createdSubTopic._id,
                                uploadedByUserId: authSession.user.id,
                                title,
                                text,
                            };
                        })
                        .filter(Boolean);

                    if (chunkDocs.length === 0) {
                        throw new Error(`Az altémához nem tartozik menthető chunk: "${subTopicTitle}"`);
                    }

                    const createdChunks = await Chunk.insertMany(chunkDocs, {
                        dbSession,
                        ordered: true,
                    });

                    results.push({
                        subTopic: createdSubTopic,
                        chunksCount: createdChunks.length,
                    });
                }
            })
        } finally {
            dbSession.endSession(); // ✅ ne szivárogjon
        }


        return { ok: true, error: "", message: "A tartalom feltöltve.", errors: {}, data: {} }

    } catch (error) {
        console.error("create topic error", error)
        const fieldErrors = {};

        // Mongoose validációs hiba
        if (error.name === "ValidationError") {

            for (const field in error.errors) {
                fieldErrors[field] = error.errors[field].message;
            }

            return {
                ok: false,
                error: "Validációs hiba",
                errors: fieldErrors,
                data: parsed.data,
            };
        }

        // Mongoose validációs hiba - már létező email
        if (error?.code === 11000) {


            // const field = Object.keys(error.keyPattern)[0];
            // const title = Object.keys(error.keyValue)[0];

            const [[field, value]] = Object.entries(error.keyValue ?? [["", ""]]);

            console.log(field);
            console.log(value);

            const fieldErrors = {};
            fieldErrors[field] = `Ez az altéma már létezik: ${value}`;

            return {
                ok: false,
                error: "",
                errors: fieldErrors,
                data: parsed.data
            };
        }

        return { ok: false, error: "Server hiba", errors: fieldErrors, data: parsed.data }
    }
}