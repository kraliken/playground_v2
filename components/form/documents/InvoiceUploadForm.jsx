"use client"

import { createUploadSessionAction, finalizeUploadAction } from "@/action/upload"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { uploadFilesToBlob } from "@/lib/blob/uploadFilesToBlob"
import { ClientFilesSchema } from "@/lib/schemas/invoice"
import { Loader2 } from "lucide-react"
import { useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"


const InvoiceUploadForm = () => {

    const fileInputRef = useRef(null);

    const [clientFiles, setClientFiles] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [progress, setProgress] = useState({ done: 0, total: 0 });

    const [isUploading, startUploadTransition] = useTransition();

    const meta = useMemo(() => {
        const count = clientFiles.length;
        const maxFileBytes = clientFiles.reduce((m, f) => Math.max(m, f.size || 0), 0);
        return { count, maxFileBytes };
    }, [clientFiles]);

    const percent =
        isUploading && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    const handleSelect = (e) => {

        const files = Array.from(e.target.files || []);
        setClientFiles(files);
        // itt kell majd a hibaüzeneteket és a progress-t resetelni új kiválasztásnál
        setValidationErrors([])

    }

    const handleUpload = async (e) => {
        e.preventDefault();

        // client oldali validálás
        const parsed = ClientFilesSchema.safeParse(clientFiles);
        if (!parsed.success) {
            const errors = parsed.error.issues.map((i) => i.message);
            setValidationErrors(errors)
            toast.error("Validációs hiba");
            return;
        }

        setValidationErrors([])

        startUploadTransition(async () => {

            try {
                const fd = new FormData();
                fd.set("count", String(meta.count));
                fd.set("maxFileBytes", String(meta.maxFileBytes));

                const session = await createUploadSessionAction(fd);

                if (!session?.ok) {
                    setValidationErrors(session?.errors || [])
                    toast.error(session?.error || "Szerver validációs hiba");
                    return;
                }

                const { uploadUrl, prefix, jobId: newJobId } = session.data || {};
                if (!uploadUrl || !prefix || !newJobId) {
                    toast.error("Hiányzó upload adatok.");
                    return;
                }

                setProgress({ done: 0, total: clientFiles.length });

                const uploadedList = await uploadFilesToBlob({
                    files: clientFiles,
                    containerSasUrl: uploadUrl,
                    prefix,
                    concurrency: 6,
                    onProgress: setProgress,
                });

                const fin = await finalizeUploadAction({
                    jobId: newJobId,
                    prefix,
                    files: uploadedList,
                });

                if (!fin?.ok) {
                    toast.error(fin?.error || "Finalize hiba");
                    return;
                }

                toast.success(`Fájlok feltöltve.`);
                setProgress({ done: 0, total: 0 });
                setClientFiles([]);
                setValidationErrors([]);
                if (fileInputRef.current) fileInputRef.current.value = "";


            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Hiba a feltöltés során";
                toast.error(message);
            }

        })
    }

    const isDisabled = isUploading || clientFiles.length < 1

    return (
        <form onSubmit={handleUpload} className="flex flex-col items-start gap-6">
            <Field>
                <FieldLabel htmlFor="file">Számlák feltöltése</FieldLabel>
                <Input
                    ref={fileInputRef}
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    onChange={(e) => handleSelect(e)}
                    disabled={isUploading}
                // aria-invalid={!!state.errors?.file}
                />
                {validationErrors && <FieldError>{validationErrors[0]}</FieldError>}
            </Field>

            {isUploading && progress.total > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Feltöltés: {progress.done}/{progress.total}</span>
                        <span>{percent}%</span>
                    </div>
                    <Progress value={percent} />
                </div>
            )}

            <Button
                type="submit"
                disabled={isDisabled}
            >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? "Feltöltés..." : "Feltöltés"}
            </Button>

        </form>
    )
}

export default InvoiceUploadForm