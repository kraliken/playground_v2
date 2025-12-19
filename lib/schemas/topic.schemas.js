import { z } from "zod"

export const CreateTopicSchema = z.object({
    name: z.string().min(1, "A név kötelező.").max(200, "Max 200 karakter."),
    description: z.string().max(600, "Max 600 karakter.").optional(),
})
