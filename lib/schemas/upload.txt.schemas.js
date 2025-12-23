import { z } from "zod"

export const TXTUploadSchema = z.object({
    topicId: z
        .string({ required_error: "Témakör kötelező." })
        .min(1, "Témakör kötelező."),

    file: z
        .instanceof(File, { message: "Fájl kötelező." })
        .refine((f) => f.size > 0, "Üres fájl nem tölthető fel.")
        .refine(
            (f) =>
                f.type === "text/plain" ||
                f.name.toLowerCase().endsWith(".txt"),
            "Csak .txt fájl tölthető fel."
        )
        // opcionális méretlimit (pl. 1MB)
        .refine((f) => f.size <= 1_000_000, "A fájl túl nagy (max 1MB)."),
})
