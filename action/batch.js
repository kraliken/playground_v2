"use server"

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/database/connection/mongoose";
import DocJob from "@/lib/database/models/DocJob";
import { env } from "@/lib/env";
import { revalidatePath } from "next/cache";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

/** ----------------------------- helpers ----------------------------- */
function logJob(jobId, ...args) {
    console.log(`[REFRESH][${jobId}]`, ...args);
}

function logWarn(jobId, ...args) {
    console.warn(`[REFRESH][${jobId}]`, ...args);
}

function logErr(jobId, ...args) {
    console.error(`[REFRESH][${jobId}]`, ...args);
}
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function toDocJobDto(docjob) {
    if (!docjob || !docjob._id) {
        throw new Error("Invalid docjob: missing _id");
    }

    const dto = {
        id: String(docjob._id),
    };

    if (hasOwn(docjob, "jobId")) dto.jobId = docjob.jobId ?? "";
    if (hasOwn(docjob, "status")) dto.status = docjob.status ?? "";
    if (hasOwn(docjob, "totalFiles")) dto.totalFiles = docjob.totalFiles ?? "";
    if (hasOwn(docjob, "createdAt")) {
        const createdAt = docjob.createdAt;
        dto.createdAt = createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
    }

    return dto;
}

function toDocJobDtos(docjobs) {
    if (!Array.isArray(docjobs)) {
        throw new Error("docjobs must be an array");
    }

    return docjobs.map(toDocJobDto);
}

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

// Azure státusz
function mapAzureStatusToLocal(azureStatus) {
    const s = String(azureStatus || "").toLowerCase();
    if (s === "running" || s === "inprogress") return "running";
    if (s === "succeeded") return "succeeded";
    if (s === "failed" || s === "canceled" || s === "cancelled") return "failed";
    // notStarted / queued / stb.
    return "submitted";
}

/** ----- invoice fields extract ----- */
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

        vendorName: readValue(fields.VendorAddressRecipient),
        vendorAddress: readValue(fields.VendorAddress),

        customerName: readValue(fields.CustomerName),
        customerAddress: readValue(fields.CustomerAddress),

        totalAmount: readCurrencyAmount(totalField),
        currency: readCurrencyCode(totalField),

        lineItems: readItems(fields.Items),

        rawJson: doc,
    };
}

/** ----- mapping: operation status -> local status ----- */
function mapOperationStatus(opStatus) {
    const s = String(opStatus || "").toLowerCase();
    if (s === "notstarted" || s === "queued") return "submitted";
    if (s === "running" || s === "inprogress") return "running";
    if (s === "succeeded") return "succeeded";
    if (s === "failed" || s === "canceled" || s === "cancelled") return "failed";
    return "running";
}

/** ----- mapping: detail status -> local file status ----- */
function mapDetailStatus(st) {
    const s = String(st || "").toLowerCase();
    if (s === "succeeded" || s === "completed") return "succeeded";
    if (s === "failed") return "failed";
    if (s === "skipped") return "skipped";
    if (s === "running" || s === "inprogress") return "running";
    if (s === "notstarted" || s === "queued") return "running";
    return "running";
}

/** ----- sourceUrl -> original file name ----- */
function originalNameFromSourceUrl(sourceUrl) {
    if (!sourceUrl) return "";
    try {
        const u = new URL(sourceUrl);
        const parts = u.pathname.split("/");
        return decodeURIComponent(parts[parts.length - 1] || "");
    } catch {
        return "";
    }
}

async function streamToString(readable) {
    if (!readable) return "";
    const chunks = [];
    for await (const chunk of readable) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
}

function getBlobServiceClient() {
    const accountName = env("AZURE_STORAGE_ACCOUNT_NAME");
    const accountKey = env("AZURE_STORAGE_ACCOUNT_KEY");
    const cred = new StorageSharedKeyCredential(accountName, accountKey);
    return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, cred);
}

/** ----- fetch json with DI auth header (resultUrl DI endpoint) ----- */
async function fetchDocIntJson(url, key) {
    const res = await fetch(url, {
        method: "GET",
        headers: { "Ocp-Apim-Subscription-Key": key },
        cache: "no-store",
    });
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`DI result fetch failed (${res.status}): ${t}`);
    }
    return res.json();
}

async function fetchOperationJson(jobId, operationLocation, diKey) {
    logJob(jobId, "Polling operationLocation:", operationLocation);

    const res = await fetch(operationLocation, {
        method: "GET",
        headers: { "Ocp-Apim-Subscription-Key": diKey },
        cache: "no-store",
    });

    const text = await res.text().catch(() => "");
    logJob(jobId, "Operation GET status:", res.status);

    if (!res.ok) {
        logWarn(jobId, "Operation GET body head:", text.slice(0, 250));
        throw new Error(`Operation GET failed (${res.status})`);
    }

    try {
        const json = JSON.parse(text);
        logJob(jobId, "Operation keys:", Object.keys(json || {}));
        logJob(jobId, "Operation.status:", json?.status, "percentCompleted:", json?.percentCompleted);
        logJob(jobId, "Has result?:", !!json?.result, "result keys:", Object.keys(json?.result || {}));
        return json;
    } catch {
        logWarn(jobId, "Operation response not JSON. head:", text.slice(0, 250));
        throw new Error("Operation response not JSON");
    }
}

async function downloadJsonFromResultContainer(jobId, containerClient, blobName) {
    const blobClient = containerClient.getBlobClient(blobName);

    const exists = await blobClient.exists();
    logJob(jobId, "Result blob exists?", exists, "blob:", blobName);

    if (!exists) return null;

    const dl = await blobClient.download(0);
    const txt = await streamToString(dl.readableStreamBody);

    logJob(jobId, "Downloaded bytes:", txt.length, "blob:", blobName);
    logJob(jobId, "Downloaded head:", txt.slice(0, 180));

    try {
        const json = JSON.parse(txt);
        logJob(jobId, "Parsed JSON keys:", Object.keys(json || {}), "blob:", blobName);
        return json;
    } catch (e) {
        logWarn(jobId, "JSON parse failed for blob:", blobName, "error:", e?.message || e);
        return null;
    }
}

export async function getAllDocJobAction() {

    const authSession = await auth();

    if (!authSession || authSession.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

    try {

        await connectToDatabase()

        const docjobs = await DocJob.find({})
            .sort({ createdAt: -1 })
            .select("jobId status totalFiles createdAt")
            .lean();

        return {
            ok: true,
            data: toDocJobDtos(docjobs),
        }

    } catch (error) {
        console.error("get all docjob action error", error)
        return { ok: false, error: "Server hiba", data: [] }
    }

}

export async function startBatchInvoiceAction(jobId) {
    const authSession = await auth();

    if (!authSession || authSession.user.role !== 'admin') {
        return {
            ok: false,
            error: "Nincs jogosultságod.",
            data: []
        };
    }

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

        // ezt átnézni
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

        revalidatePath("/dashboard/docint/batch")

        return { ok: true, error: "", data: { jobId, operationLocation, resultId } };


    } catch (error) {
        console.error("start Bbtch invoice action error:", error);
        return { ok: false, error: "Batch indítás sikertelen", errors: {} };
    }
}

/**
 * Refresh:
 * - végigmegy az összes jobon, ahol van operationLocation
 * - lekéri az Azure operation státuszt
 * - frissíti a job státuszt + számlálókat
 * - frissíti a files[] státuszokat ORIGINAL NAME alapján
 * - ha van resultUrl és még nincs extractedData, letölti és extractál
 */
export async function refreshDocJobStatusesAction({ jobId } = {}) {
    const authSession = await auth();
    if (!authSession || authSession.user.role !== "admin") {
        return { ok: false, error: "Nincs jogosultságod.", data: { updatedJobs: 0, updatedFiles: 0 } };
    }

    try {
        await connectToDatabase();

        const diKey = env("AZURE_DOCINT_KEY");
        const resultContainer = env("AZURE_STORAGE_RESULT_CONTAINER");

        logJob(jobId || "*", "Refresh started. resultContainer:", resultContainer);

        // teszthez: jobId-val célzottan
        const query = jobId
            ? { jobId }
            : {
                operationLocation: { $exists: true, $ne: "" },
                $or: [{ status: { $in: ["submitted", "running"] } }, { "files.status": "uploaded" }],
            };

        const jobs = await DocJob.find(query)
            .select("jobId status operationLocation prefix files totalFiles percentCompleted succeededCount failedCount skippedCount")
            .lean();

        logJob(jobId || "*", "Jobs matched:", jobs.length);

        if (!jobs.length) {
            return { ok: false, error: "Nincs frissíthető job.", data: { updatedJobs: 0, updatedFiles: 0 } };
        }

        const blobService = getBlobServiceClient();
        const resultContainerClient = blobService.getContainerClient(resultContainer);

        let updatedJobs = 0;
        let updatedFiles = 0;

        for (const jobLean of jobs) {
            const id = jobLean.jobId;

            logJob(id, "----------------------------------------");
            logJob(id, "DB before:", {
                status: jobLean.status,
                totalFiles: jobLean.totalFiles,
                percentCompleted: jobLean.percentCompleted,
                succeededCount: jobLean.succeededCount,
                failedCount: jobLean.failedCount,
                skippedCount: jobLean.skippedCount,
                filesCount: Array.isArray(jobLean.files) ? jobLean.files.length : 0,
                prefix: jobLean.prefix,
            });

            const doc = await DocJob.findOne({ jobId: id });
            if (!doc) {
                logWarn(id, "Doc not found on second fetch.");
                continue;
            }

            const prevJobStatus = doc.status;

            // 1) operation poll
            let op = null;
            try {
                if (doc.operationLocation) {
                    op = await fetchOperationJson(id, doc.operationLocation, diKey);
                } else {
                    logWarn(id, "Missing operationLocation on doc.");
                }
            } catch (e) {
                logErr(id, "Operation poll error:", e?.message || e);
            }

            // 2) apply operation summary + details (ha van)
            if (op) {
                const mapped = mapOperationStatus(op?.status);
                logJob(id, "Mapped job status:", mapped);

                doc.status = mapped;
                doc.percentCompleted = op?.percentCompleted ?? doc.percentCompleted;

                // csak ha szám
                const sc = op?.result?.succeededCount;
                const fc = op?.result?.failedCount;
                const kc = op?.result?.skippedCount;

                logJob(id, "Op result counts (raw):", { sc, fc, kc });

                if (typeof sc === "number") doc.succeededCount = sc;
                if (typeof fc === "number") doc.failedCount = fc;
                if (typeof kc === "number") doc.skippedCount = kc;

                const details = Array.isArray(op?.result?.details) ? op.result.details : [];
                logJob(id, "Details length:", details.length);

                if (details.length) {
                    // build map by originalName
                    const byOriginal = new Map();
                    for (const d of details) {
                        const src = d?.sourceUrl || "";
                        const on = originalNameFromSourceUrl(src);
                        const st = mapDetailStatus(d?.status);
                        const resultUrl = d?.resultUrl || "";
                        const err = d?.error?.message || d?.error?.code || "";

                        logJob(id, "Detail item:", {
                            originalName: on,
                            status: d?.status,
                            mappedStatus: st,
                            hasResultUrl: !!resultUrl,
                            hasError: !!err,
                        });

                        if (on) {
                            byOriginal.set(on, { status: st, resultUrl, errorMessage: err });
                        }
                    }

                    // apply map
                    doc.files = doc.files.map((f) => {
                        const fo = typeof f.toObject === "function" ? f.toObject() : f;
                        const upd = byOriginal.get(fo.originalName);

                        if (!upd) {
                            logWarn(id, "No detail match for file originalName:", fo.originalName);
                            return fo;
                        }

                        updatedFiles++;

                        const next = {
                            ...fo,
                            status: upd.status || fo.status,
                            resultUrl: upd.resultUrl || fo.resultUrl,
                            errorMessage: upd.errorMessage || fo.errorMessage,
                            lastUpdatedAt: new Date(),
                        };

                        logJob(id, "File updated from details:", {
                            originalName: fo.originalName,
                            prevStatus: fo.status,
                            nextStatus: next.status,
                            resultUrl: next.resultUrl ? "[set]" : "[empty]",
                            errorMessage: next.errorMessage ? next.errorMessage.slice(0, 120) : "",
                        });

                        return next;
                    });

                    doc.markModified("files");
                } else {
                    logWarn(id, "No op.result.details found (or empty). Will rely on result container sync.");
                }
            } else {
                logWarn(id, "No operation JSON. Will rely on result container sync only.");
            }

            // 3) result container sync: `${blobName}.ocr.json`
            if (Array.isArray(doc.files) && doc.files.length) {
                logJob(id, "Result sync start. files:", doc.files.length);

                doc.files = await Promise.all(
                    doc.files.map(async (f) => {
                        const fo = typeof f.toObject === "function" ? f.toObject() : f;

                        const expectedOcr = `${fo.blobName}.ocr.json`;
                        const alreadyExtracted =
                            !!fo.extractedData?.invoiceNumber || !!fo.extractedData?.rawJson;

                        logJob(id, "Check OCR for file:", {
                            originalName: fo.originalName,
                            blobName: fo.blobName,
                            expectedOcr,
                            alreadyExtracted,
                            currentStatus: fo.status,
                        });

                        const ocrJson = await downloadJsonFromResultContainer(id, resultContainerClient, expectedOcr);

                        if (!ocrJson) {
                            // Ha job succeeded, de nincs output -> jelöljük failed-nek
                            if (doc.status === "succeeded" && fo.status === "uploaded") {
                                updatedFiles++;
                                logWarn(id, "Job succeeded but OCR missing -> mark file failed:", fo.originalName);

                                return {
                                    ...fo,
                                    status: "failed",
                                    errorMessage: fo.errorMessage || "Hiányzó eredmény (.ocr.json) a result containerben",
                                    lastUpdatedAt: new Date(),
                                };
                            }
                            return fo;
                        }

                        let extractedData = fo.extractedData || {};
                        if (!alreadyExtracted) {
                            const extracted = extractInvoiceFields(ocrJson);
                            logJob(id, "Extract result:", {
                                originalName: fo.originalName,
                                hasExtracted: !!extracted,
                                invoiceNumber: extracted?.invoiceNumber || "",
                                vendorName: extracted?.vendorName || "",
                            });

                            if (extracted) extractedData = extracted;
                        } else {
                            logJob(id, "Skip extract (already extracted):", fo.originalName);
                        }

                        updatedFiles++;

                        return {
                            ...fo,
                            status: "succeeded",
                            resultUrl: fo.resultUrl || expectedOcr,
                            errorMessage: fo.errorMessage || "",
                            extractedData,
                            lastUpdatedAt: new Date(),
                        };
                    })
                );

                doc.markModified("files");
            } else {
                logWarn(id, "No files on doc to sync.");
            }

            // 4) recompute counts + aggregate job status
            let succeeded = 0;
            let failed = 0;
            let skipped = 0;

            for (const f of doc.files || []) {
                if (f.status === "succeeded") succeeded++;
                else if (f.status === "failed") failed++;
                else if (f.status === "skipped") skipped++;
            }

            const total = doc.totalFiles || (doc.files ? doc.files.length : 0);
            const done = succeeded + failed + skipped;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            logJob(id, "Counts recompute:", { total, done, succeeded, failed, skipped, percent });

            doc.succeededCount = succeeded;
            doc.failedCount = failed;
            doc.skippedCount = skipped;
            doc.percentCompleted = percent;

            if (total > 0 && done >= total) {
                const aggStatus = failed > 0 ? "failed" : "succeeded";
                logJob(id, "Aggregate job status ->", aggStatus);
                doc.status = aggStatus;
            } else {
                logJob(id, "Job not complete yet (done < total). Keep status:", doc.status);
            }

            await doc.save();

            logJob(id, "DB after save:", {
                status: doc.status,
                percentCompleted: doc.percentCompleted,
                succeededCount: doc.succeededCount,
                failedCount: doc.failedCount,
                skippedCount: doc.skippedCount,
                firstFile: doc.files?.[0]
                    ? { originalName: doc.files[0].originalName, status: doc.files[0].status, hasExtract: !!doc.files[0].extractedData?.rawJson }
                    : null,
            });

            if (prevJobStatus !== doc.status) updatedJobs++;
        }

        revalidatePath("/dashboard/docint/batch");
        logJob(jobId || "*", "Refresh finished.", { updatedJobs, updatedFiles });

        return { ok: true, error: "", data: { updatedJobs, updatedFiles } };
    } catch (error) {
        console.error("refreshDocJobStatusesAction error:", error);
        return { ok: false, error: "Státusz frissítés sikertelen", data: { updatedJobs: 0, updatedFiles: 0 } };
    }
}