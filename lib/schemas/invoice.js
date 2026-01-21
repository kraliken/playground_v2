import { z } from "zod";
import { UPLOAD_CONSTRAINTS as C } from "../constans";

export const PdfUploadSchema = z.object({
    files: z
        .array(
            z.object({
                name: z.string(),
                type: z.string().refine((type) => type === "application/pdf", "Csak PDF-ek engedélyezettek."),
                size: z
                    .number()
                    .max(
                        C.MAX_FILE_SIZE_BYTES,
                        `A fájl túl nagy (max ${(C.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB).`
                    ),
            })
        )
        .min(1, "Válassz ki legalább 1 PDF-et.")
        .max(C.MAX_FILES, `Maximum ${C.MAX_FILES} PDF lehet.`),
});

const ClientFileSchema = z
    .instanceof(File)
    .refine((f) => f.type === "application/pdf" || (f.name || "").toLowerCase().endsWith(".pdf"), {
        message: "Csak PDF-ek engedélyezettek.",
    })
    .refine((f) => f.size <= C.MAX_FILE_SIZE_BYTES, {
        message: `A fájl túl nagy (max ${(C.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB).`,
    });

export const ClientFilesSchema = z
    .array(ClientFileSchema)
    .min(1, { message: "Válassz ki legalább 1 PDF-et." })
    .max(C.MAX_FILES, { message: `Maximum ${C.MAX_FILES} PDF lehet.` });

export const FinalizeSchema = z.object({
    jobId: z.string().min(1),
    prefix: z.string().min(1),
    files: z
        .array(
            z.object({
                originalName: z.string().min(1),
                blobName: z.string().min(1),
            })
        )
        .min(1),
});
