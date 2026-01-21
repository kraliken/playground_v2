"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import {
    createUploadSessionAction,
    finalizeUploadAction,
    startBatchInvoiceAction,
} from "@/action/upload";

import { UPLOAD_CONSTRAINTS as C } from "@/lib/constans";
import { toSafeBlobName } from "@/lib/blob/toSafeBlobName";

const FileSchema = z
    .instanceof(File)
    .refine((f) => f.type === "application/pdf" || (f.name || "").toLowerCase().endsWith(".pdf"), {
        message: "Csak PDF-ek engedélyezettek.",
    })
    .refine((f) => f.size <= C.MAX_FILE_SIZE_BYTES, {
        message: `A fájl túl nagy (max ${(C.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB).`,
    });

const FilesSchema = z
    .array(FileSchema)
    .min(1, { message: "Válassz ki legalább 1 PDF-et." })
    .max(C.MAX_FILES, { message: `Maximum ${C.MAX_FILES} PDF lehet.` });



// export default function UploadPdfJobForm({ onJobReady }) {
export default function UploadPdfJobForm() {

    const [clientFiles, setClientFiles] = useState([]);
    const [errors, setErrors] = useState([]);
    const [progress, setProgress] = useState({ done: 0, total: 0 });


    const [isUploading, startUploadTransition] = useTransition();
    const [isStartingBatch, startBatchTransition] = useTransition();

    const [jobId, setJobId] = useState("");
    const [uploadComplete, setUploadComplete] = useState(false);

    const fileInputRef = useRef(null);

    const meta = useMemo(() => {
        const count = clientFiles.length;
        const maxFileBytes = clientFiles.reduce((m, f) => Math.max(m, f.size || 0), 0);
        return { count, maxFileBytes };
    }, [clientFiles]);

    const percent =
        isUploading && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    const handleUpload = async (e) => {
        e.preventDefault();

        const parsed = FilesSchema.safeParse(clientFiles);
        if (!parsed.success) {
            const msgs = parsed.error.issues.map((i) => i.message);
            setErrors(msgs);
            toast.error("Validációs hiba");
            return;
        }

        setErrors([]);

        startUploadTransition(async () => {
            try {
                // 1) session
                const fd = new FormData();
                fd.set("count", String(meta.count));
                fd.set("maxFileBytes", String(meta.maxFileBytes));

                const session = await createUploadSessionAction(undefined, fd);
                if (!session?.ok) {
                    toast.error(session?.error || "Szerver validációs hiba");
                    return;
                }

                const { uploadUrl, prefix, jobId: newJobId } = session.data || {};
                if (!uploadUrl || !prefix || !newJobId) {
                    toast.error("Hiányzó upload adatok.");
                    return;
                }

                // 2) upload
                setProgress({ done: 0, total: clientFiles.length });

                const uploadedList = await uploadFilesToBlob({
                    files: clientFiles,
                    containerSasUrl: uploadUrl,
                    prefix,
                    concurrency: 6,
                    onProgress: setProgress,
                });

                // 3) finalize -> MongoDB
                const fin = await finalizeUploadAction({
                    jobId: newJobId,
                    prefix,
                    files: uploadedList,
                });

                if (!fin?.ok) {
                    toast.error(fin?.error || "Finalize hiba");
                    return;
                }

                toast.success(`Fájlok feltöltve. Mostmár indíthatod a feldolgozást.`);

                setJobId(newJobId);
                setUploadComplete(true);
                setProgress({ done: 0, total: 0 });
            } catch (err) {
                toast.error(err?.message || "Hiba a feltöltés során");
            }
        });
    };

    const handleStartBatch = async () => {
        if (!jobId) return;

        startBatchTransition(async () => {
            try {
                const started = await startBatchInvoiceAction(jobId);
                if (!started?.ok) {
                    toast.error(started?.error || "Batch indítás hiba");
                    return;
                }

                toast.success(`Batch feldolgozás elindítva. Job: ${jobId}`);

                // reset UI
                setClientFiles([]);
                setProgress({ done: 0, total: 0 });
                setJobId("");
                setUploadComplete(false);
                if (fileInputRef.current) fileInputRef.current.value = "";

                // mutassuk a státusz komponenst
                // onJobReady?.(jobId);
            } catch (err) {
                toast.error(err?.message || "Hiba a batch indítás során");
            }
        });
    };

    return (
        <form onSubmit={handleUpload} className="flex flex-col gap-3">
            <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                disabled={isUploading || uploadComplete}
                onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setClientFiles(files);
                    setErrors([]);
                    setProgress({ done: 0, total: 0 });
                }}
            />

            {errors.length > 0 && (
                <div className="text-sm text-red-500">
                    {errors.slice(0, 10).map((m, i) => (
                        <div key={i}>{m}</div>
                    ))}
                    {errors.length > 10 && <div>(+{errors.length - 10} további hiba)</div>}
                </div>
            )}

            {isUploading && progress.total > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Feltöltés: {progress.done}/{progress.total}</span>
                        <span>{percent}%</span>
                    </div>
                    <Progress value={percent} />
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    type="submit"
                    disabled={isUploading || uploadComplete || clientFiles.length === 0}
                >
                    {isUploading ? "Feltöltés..." : "Feltöltése"}
                </Button>

                {/* {uploadComplete && (
                    <Button
                        type="button"
                        onClick={handleStartBatch}
                        disabled={isStartingBatch || !jobId}
                        variant="default"
                    >
                        {isStartingBatch ? "Feldolgozás indítása..." : "2. Batch feldolgozás indítása"}
                    </Button>
                )} */}
            </div>

            {uploadComplete && jobId && (
                <div className="text-sm text-green-600">
                    ✓ Fájlok feltöltve. Job ID: {jobId}
                </div>
            )}
        </form>
    );
}