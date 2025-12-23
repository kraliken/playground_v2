import { z } from "zod"

export const TopicSchema = z.object({
    title: z.string()
        .min(1, "Az elnevezés megadása kötelező.")
        .min(3, "Az elnevezés legalább 3 karakter hosszú legyen.")
        .max(80, "Az elnevezés max 80 karakter."),
    description: z.string()
        .max(300, "A leyrás max 300 karakter."),
})
