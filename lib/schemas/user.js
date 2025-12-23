import { z } from "zod"

export const CreateUserSchema = z.object({
    fullname: z.string()
        .min(1, "A név megadása kötelező.")
        .min(4, "A név legalább 4 karakter hosszú legyen.")
        .max(100, "Max 100 karakter."),
    email: z.string()
        .min(1, "Az email cím megadása kötelező.")
        .email("Érvénytelen email formátum."),
})
