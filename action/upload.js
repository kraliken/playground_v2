"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import {
    StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { BlobServiceClient } from "@azure/storage-blob";

import { UPLOAD_CONSTRAINTS as C } from "@/lib/constans";
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import DocJob from "@/lib/database/models/DocJob";
import { zodFieldErrors } from "@/lib/helpers/validation";
import { getContainerSasUrl } from "@/lib/azure/sas";
import { env } from "@/lib/env";
import { FinalizeSchema } from "@/lib/schemas/invoice";

function extractInvoiceFields(diResult) {
    const docs = diResult?.analyzeResult?.documents;
    if (!Array.isArray(docs) || docs.length === 0) return null;

    const doc = docs[0];
    const fields = doc.fields || {};

    const readValue = (field) => {
        if (!field) return "";

        if (field.valueString != null) return String(field.valueString);
        if (field.valueDate != null) return String(field.valueDate);
        if (field.valueNumber != null) return String(field.valueNumber);
        if (field.valueInteger != null) return String(field.valueInteger);
        if (field.valuePhoneNumber != null) return String(field.valuePhoneNumber);
        if (field.valueSelectionMark != null) return String(field.valueSelectionMark);

        if (field.content != null) return String(field.content);

        return "";
    };

    const readCurrencyAmount = (field) => {
        const vc = field?.valueCurrency;
        if (vc?.amount != null) return String(vc.amount);
        return readValue(field);
    };

    const readCurrencyCode = (field) => {
        const vc = field?.valueCurrency;
        if (vc?.currencyCode) return String(vc.currencyCode);
        if (vc?.currencySymbol) return String(vc.currencySymbol);
        return "";
    };

    const readItems = (itemsField) => {
        const arr = itemsField?.valueArray;
        if (!Array.isArray(arr)) return [];

        return arr.map((it) => {
            const obj = it?.valueObject || {};
            return {
                description: readValue(obj.Description),
                quantity: readValue(obj.Quantity),
                unitPrice: readCurrencyAmount(obj.UnitPrice),
                amount: readCurrencyAmount(obj.Amount),
                currency: readCurrencyCode(obj.Amount) || readCurrencyCode(obj.UnitPrice),
            };
        });
    };

    const totalField = fields.InvoiceTotal;

    return {
        invoiceNumber: readValue(fields.InvoiceId) || readValue(fields.InvoiceNumber),
        invoiceDate: readValue(fields.InvoiceDate),
        dueDate: readValue(fields.DueDate),

        vendorName: readValue(fields.VendorName),
        vendorAddress: readValue(fields.VendorAddress),

        customerName: readValue(fields.CustomerName),
        customerAddress: readValue(fields.CustomerAddress),

        totalAmount: readCurrencyAmount(totalField),
        currency: readCurrencyCode(totalField),

        lineItems: readItems(fields.Items),

        rawJson: doc, // debug + későbbi finomhangolás
    };
}

const UploadMetaSchema = z.object({
    count: z
        .number()
        .int()
        .min(1, "Válassz ki legalább 1 PDF-et.")
        .max(C.MAX_FILES, `Maximum ${C.MAX_FILES} PDF lehet.`),
    maxFileBytes: z
        .number()
        .int()
        .min(1)
        .max(
            C.MAX_FILE_SIZE_BYTES,
            `Túl nagy fájl (max ${(C.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB).`
        ),
});

// ========= 1) create upload session =========
export async function createUploadSessionAction(formData) {

    // szerver oldali alap validáció (darabszám, legnagyobb fájl)
    const raw = {
        count: Number(formData.get("count")),
        maxFileBytes: Number(formData.get("maxFileBytes")),
    };

    const parsed = UploadMetaSchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validációs hiba",
            errors: zodFieldErrors(parsed.error),
        };
    }

    try {
        const jobId = randomUUID();
        const prefix = `${jobId}/`;

        const accountName = env("AZURE_STORAGE_ACCOUNT_NAME");
        const accountKey = env("AZURE_STORAGE_ACCOUNT_KEY");
        const sourceContainer = env("AZURE_STORAGE_SOURCE_CONTAINER");

        const uploadUrl = getContainerSasUrl({
            accountName,
            accountKey,
            containerName: sourceContainer,
            expiresInMinutes: 15,
        });

        return {
            ok: true,
            error: "",
            message: "Upload session kész.",
            data: { jobId, prefix, uploadUrl },
        };
    } catch (e) {
        console.error(e);
        return { ok: false, error: "SAS generálás sikertelen.", errors: {} };
    }
}

// ========= 2) finalize upload: job + file list mentése =========
export async function finalizeUploadAction(payload) {
    const parsed = FinalizeSchema.safeParse(payload);
    if (!parsed.success) {
        return { ok: false, error: "Finalize validációs hiba", errors: zodFieldErrors(parsed.error) };
    }

    const { jobId, prefix, files } = parsed.data;

    try {
        await connectToDatabase();

        await DocJob.updateOne(
            { jobId },
            {
                $setOnInsert: {
                    jobId,
                    prefix,
                    modelId: "prebuilt-invoice",
                },
                $set: {
                    status: "uploaded",
                    totalFiles: files.length,
                    percentCompleted: 0,
                    succeededCount: 0,
                    failedCount: 0,
                    skippedCount: 0,
                    files: files.map((f) => ({
                        originalName: f.originalName,
                        blobName: f.blobName,
                        status: "uploaded",
                        lastUpdatedAt: new Date(),
                    })),
                },
            },
            { upsert: true }
        );

        return { ok: true, error: "", data: { jobId } };
    } catch (err) {
        console.error("finalizeUploadAction error:", err);
        return { ok: false, error: "Adatbázis mentési hiba", errors: {} };
    }
}

// ========= 3) start batch (prebuilt-invoice) =========
function getPlainContainerUrl(accountName, containerName) {
    return `https://${accountName}.blob.core.windows.net/${containerName}`;
}

function extractResultId(operationLocation) {
    try {
        const url = new URL(operationLocation);
        const parts = url.pathname.split("/");
        return parts[parts.length - 1] || "";
    } catch {
        return "";
    }
}

export async function startBatchInvoiceAction(jobId) {
    if (!jobId) return { ok: false, error: "Hiányzó jobId", errors: {} };

    try {
        await connectToDatabase();
        const job = await DocJob.findOne({ jobId }).lean();
        if (!job) return { ok: false, error: "Job nem található", errors: {} };

        const endpoint = env("AZURE_DOCINT_ENDPOINT").replace(/\/+$/, "");
        const key = env("AZURE_DOCINT_KEY");

        const accountName = env("AZURE_STORAGE_ACCOUNT_NAME");
        const sourceContainer = env("AZURE_STORAGE_SOURCE_CONTAINER");
        const resultContainer = env("AZURE_STORAGE_RESULT_CONTAINER");

        const sourceContainerUrl = getPlainContainerUrl(accountName, sourceContainer);
        const resultContainerUrl = getPlainContainerUrl(accountName, resultContainer);

        const apiVersion = "2024-11-30";
        const modelId = "prebuilt-invoice";

        const url = `${endpoint}/documentintelligence/documentModels/${modelId}:analyzeBatch?api-version=${apiVersion}`;

        const body = {
            azureBlobSource: {
                containerUrl: sourceContainerUrl,
                prefix: job.prefix,
            },
            resultContainerUrl: resultContainerUrl,
            resultPrefix: job.prefix,
            overwriteExisting: true,
        };

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const t = await res.text().catch(() => "");
            return { ok: false, error: `Batch indítás hiba (${res.status}): ${t}`, errors: {} };
        }

        const operationLocation = res.headers.get("operation-location") || "";
        const resultId = extractResultId(operationLocation);

        await DocJob.updateOne(
            { jobId },
            {
                $set: {
                    status: "submitted",
                    operationLocation,
                    resultId,
                },
            }
        );

        return { ok: true, error: "", data: { jobId, operationLocation, resultId } };
    } catch (err) {
        console.error("startBatchInvoiceAction error:", err);
        return { ok: false, error: "Batch indítás sikertelen", errors: {} };
    }
}

function toPlainJob(job) {
    if (!job) return null;

    const plain = typeof job.toObject === "function" ? job.toObject() : job;

    return {
        ...plain,
        _id: plain._id ? String(plain._id) : "",
        createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
        updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
        files: (plain.files || []).map((f) => ({
            ...f,
            lastUpdatedAt: f.lastUpdatedAt ? new Date(f.lastUpdatedAt).toISOString() : null,
        })),
    };
}

function getBlobServiceClient() {
    const accountName = env("AZURE_STORAGE_ACCOUNT_NAME");
    const accountKey = env("AZURE_STORAGE_ACCOUNT_KEY");

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const url = `https://${accountName}.blob.core.windows.net`;

    return new BlobServiceClient(url, credential);
}

async function listBlobNames({ containerName, prefix }) {
    const service = getBlobServiceClient();
    const container = service.getContainerClient(containerName);

    const names = [];
    for await (const b of container.listBlobsFlat({ prefix })) {
        names.push(b.name);
    }
    return names;
}

// ========= NEW: stream -> string helper (kell a blob JSON letöltéshez) =========
async function streamToString(readableStream) {
    if (!readableStream) return "";

    // Node.js stream
    if (typeof readableStream.on === "function") {
        return await new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on("data", (data) => chunks.push(Buffer.from(data)));
            readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            readableStream.on("error", reject);
        });
    }

    // Web ReadableStream fallback
    const reader = readableStream.getReader?.();
    if (!reader) return "";

    const chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(typeof value === "string" ? Buffer.from(value) : Buffer.from(value));
    }
    return Buffer.concat(chunks).toString("utf8");
}

// ========= 4) get status + per-file státusz frissítés =========
export async function getJobStatusAction(jobId) {
    if (!jobId) return { ok: false, error: "Hiányzó jobId", errors: {} };

    try {
        await connectToDatabase();

        const jobLean = await DocJob.findOne({ jobId }).lean();
        if (!jobLean) return { ok: false, error: "Job nem található", errors: {} };

        console.log("[JOB] getJobStatusAction:", jobId);
        console.log("[JOB] status:", jobLean.status, "prefix:", jobLean.prefix);

        // ---- 1) Poll DocInt operation (ha még fut) ----
        const shouldPollDocInt =
            !!jobLean.operationLocation &&
            jobLean.status !== "succeeded" &&
            jobLean.status !== "failed";

        let op = null;
        let newStatus = jobLean.status;

        if (shouldPollDocInt) {
            const key = env("AZURE_DOCINT_KEY");

            const res = await fetch(jobLean.operationLocation, {
                method: "GET",
                headers: { "Ocp-Apim-Subscription-Key": key },
                cache: "no-store",
            });

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                console.log("[DOCINT] status poll failed:", res.status, t);

                if (res.status === 429) {
                    return {
                        ok: true,
                        error: "",
                        data: toPlainJob(jobLean),
                        meta: { rateLimited: true, retryAfterSeconds: 6 },
                    };
                }

                return { ok: false, error: `Státusz lekérés hiba (${res.status}): ${t}`, errors: {} };
            }

            op = await res.json();
            console.log("[DOCINT] op.status:", op?.status, "percent:", op?.percentCompleted);

            const statusMap = {
                notStarted: "submitted",
                running: "running",
                succeeded: "succeeded",
                failed: "failed",
            };
            newStatus = statusMap[op.status] || "running";
        }

        // ---- 2) Load mutable doc ----
        const updated = await DocJob.findOne({ jobId });
        if (!updated) return { ok: false, error: "Job nem található", errors: {} };

        // ---- 3) Apply per-file updates from DocInt result.details ----
        if (op) {
            const details = op?.result?.details || [];
            const fileUpdatesByBlob = new Map();

            for (const d of details) {
                const sourceUrl = d.sourceUrl || "";
                const st = d.status || "";
                const resultUrl = d.resultUrl || "";
                const errMsg = d?.error?.message || d?.error?.code || "";

                let blobName = "";
                try {
                    const u = new URL(sourceUrl);
                    const parts = u.pathname.split("/");
                    blobName = parts.slice(2).join("/"); // container után
                } catch { }

                if (blobName) {
                    fileUpdatesByBlob.set(blobName, {
                        status: st,
                        resultUrl,
                        errorMessage: errMsg,
                    });
                }
            }

            updated.status = newStatus;
            updated.percentCompleted = op.percentCompleted ?? updated.percentCompleted;
            updated.succeededCount = op?.result?.succeededCount ?? updated.succeededCount;
            updated.failedCount = op?.result?.failedCount ?? updated.failedCount;
            updated.skippedCount = op?.result?.skippedCount ?? updated.skippedCount;

            if (fileUpdatesByBlob.size > 0) {
                updated.files = updated.files.map((f) => {
                    const upd = fileUpdatesByBlob.get(f.blobName);
                    if (!upd) return f;

                    const fo = typeof f.toObject === "function" ? f.toObject() : f;

                    return {
                        ...fo,
                        status: upd.status || fo.status,
                        // DocInt resultUrl NEM blob url; de most elmentjük debugra
                        resultUrl: upd.resultUrl || fo.resultUrl,
                        errorMessage: upd.errorMessage || fo.errorMessage,
                        lastUpdatedAt: new Date(),
                    };
                });

                updated.markModified("files");
            }
        }

        // ---- 4) RESULT CONTAINER SYNC: keressük az .ocr.json-t és kinyerjük az adatokat ----
        try {
            const resultContainer = env("AZURE_STORAGE_RESULT_CONTAINER");
            const prefix = jobLean.prefix; // nálad tipikusan `${jobId}/`

            console.log("[SYNC] resultContainer:", resultContainer);
            console.log("[SYNC] listing blobs with prefix:", prefix);

            const resultBlobNames = await listBlobNames({
                containerName: resultContainer,
                prefix,
            });

            console.log("[SYNC] found blobs count:", resultBlobNames.length);
            console.log("[SYNC] found blobs sample:", resultBlobNames.slice(0, 20));

            const resultSet = new Set(resultBlobNames);

            const expectedList = updated.files.map((f) => `${f.blobName}.ocr.json`);
            console.log("[SYNC] expected OCR blobs:", expectedList);

            const service = getBlobServiceClient();
            const container = service.getContainerClient(resultContainer);

            let extractedAny = false;

            updated.files = await Promise.all(
                updated.files.map(async (f) => {
                    // !!! nagyon fontos: subdoc -> plain object
                    const fo = typeof f.toObject === "function" ? f.toObject() : f;

                    const expectedOcr = `${fo.blobName}.ocr.json`;

                    if (!resultSet.has(expectedOcr)) {
                        return fo;
                    }

                    // már van extracted? ne töltsük újra minden pollnál
                    const alreadyExtracted = !!fo.extractedData?.invoiceNumber || !!fo.extractedData?.rawJson;

                    console.log("[EXTRACT] matched:", expectedOcr, "alreadyExtracted:", alreadyExtracted);

                    if (!alreadyExtracted) {
                        try {
                            const blobClient = container.getBlobClient(expectedOcr);
                            const dl = await blobClient.download(0);
                            const downloaded = await streamToString(dl.readableStreamBody);

                            console.log("[EXTRACT] downloaded bytes:", downloaded?.length);
                            console.log("[EXTRACT] downloaded head:", downloaded?.slice(0, 120));

                            const ocrData = JSON.parse(downloaded);

                            console.log("[EXTRACT] top keys:", Object.keys(ocrData || {}));
                            console.log("[EXTRACT] analyzeResult keys:", Object.keys(ocrData?.analyzeResult || {}));
                            console.log("[EXTRACT] documents len:", ocrData?.analyzeResult?.documents?.length);
                            console.log(
                                "[EXTRACT] fields keys sample:",
                                Object.keys(ocrData?.analyzeResult?.documents?.[0]?.fields || {}).slice(0, 10)
                            );

                            const extracted = extractInvoiceFields(ocrData);
                            console.log("[EXTRACT] extracted:", extracted);

                            fo.extractedData = extracted || {};
                            extractedAny = true;
                        } catch (e) {
                            console.error("[EXTRACT] download/parse error:", expectedOcr, e);
                        }
                    }

                    // Ha már megvan az ocr.json, itt sikeresnek vehetjük
                    return {
                        ...fo,
                        status: "succeeded",
                        // itt most blob név (nem SAS url). SAS csak böngészős open-hez kell.
                        resultUrl: expectedOcr,
                        errorMessage: "",
                        lastUpdatedAt: new Date(),
                    };
                })
            );

            if (extractedAny) {
                console.log("[SYNC] extractedData updated for at least one file.");
            }

            // mentésre kényszerítjük a files tömböt
            updated.markModified("files");

            // újraszámoljuk a számlálókat
            let succeeded = 0;
            let failed = 0;
            let skipped = 0;

            for (const f of updated.files) {
                if (f.status === "succeeded") succeeded++;
                else if (f.status === "failed") failed++;
                else if (f.status === "skipped") skipped++;
            }

            updated.succeededCount = succeeded;
            updated.failedCount = failed;
            updated.skippedCount = skipped;

            const doneCount = succeeded + failed + skipped;
            updated.percentCompleted = updated.totalFiles > 0 ? Math.round((doneCount / updated.totalFiles) * 100) : 0;

            if (updated.totalFiles > 0 && doneCount >= updated.totalFiles) {
                updated.status = failed > 0 ? "failed" : "succeeded";
            } else if (updated.operationLocation) {
                if (updated.status !== "failed" && updated.status !== "succeeded") {
                    updated.status = "running";
                }
            }
        } catch (e) {
            console.error("[SYNC] Result blob sync error:", e);
        }

        // ---- 5) Save + verify in logs ----
        await updated.save();

        const verify = await DocJob.findOne({ jobId }).lean();
        console.log(
            "[VERIFY_DB] extracted invoiceNumber:",
            verify?.files?.[0]?.extractedData?.invoiceNumber
        );

        console.log("[SAVE] jobId:", updated.jobId, "first file extractedData keys:", Object.keys(updated.files?.[0]?.extractedData || {}));

        return { ok: true, error: "", data: toPlainJob(updated) };
    } catch (err) {
        console.error("[JOB] getJobStatusAction error:", err);
        return { ok: false, error: "Státusz lekérdezés sikertelen", errors: {} };
    }
}

// ========= 4/b) UI kompatibilitás: “sync” action =========
export async function syncExtractedDataAction(jobId) {
    // A getJobStatusAction már elvégzi:
    // - result container listázás
    // - .ocr.json letöltés
    // - mezők kinyerése + mentés
    return await getJobStatusAction(jobId);
}

// ========= 5) get all jobs =========
export async function getJobsAction() {
    try {
        await connectToDatabase();

        const jobs = await DocJob.find().sort({ createdAt: -1 }).lean();

        const plainJobs = jobs.map((job) => ({
            jobId: job.jobId,
            status: job.status,
            percentCompleted: job.percentCompleted,
            totalFiles: job.totalFiles,
            succeededCount: job.succeededCount,
            failedCount: job.failedCount,
            skippedCount: job.skippedCount,
            createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
            updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
            files: (job.files || []).map((f) => ({
                originalName: f.originalName,
                blobName: f.blobName,
                status: f.status,
                resultUrl: f.resultUrl,
                errorMessage: f.errorMessage,
                lastUpdatedAt: f.lastUpdatedAt ? new Date(f.lastUpdatedAt).toISOString() : null,
                extractedData: f.extractedData || {},
            })),
        }));

        return {
            ok: true,
            error: "",
            data: plainJobs,
        };
    } catch (error) {
        console.error("getJobsAction error:", error);
        return {
            ok: false,
            error: error.message || "Feladatok lekérdezési hiba",
            data: [],
        };
    }
}
