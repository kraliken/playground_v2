import { z } from "zod"

export const SignInSchema = z.object({
    email: z.email("Érvénytelen email formátum."),
    password: z.string()
        .min(1, "A jelszó megadása kötelező.")
        .min(4, "A jelszó legalább 4 karakter hosszú.")
        .max(50, "Max 50 karakter."),
})