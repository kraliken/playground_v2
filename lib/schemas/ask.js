import { z } from "zod"

export const AskSchema = z.object({
    topicId: z.string().min(1, "Az témakör id hiányzik."),
    subTopicId: z.string().min(1, "Az altémakör id hiányzik."),
    chunkId: z.string().optional(),
    maxUiCitations: z.coerce.number().int().min(1).max(6).default(2),
    chatHistoryJson: z.string().optional(),
    question: z.string().min(4).max(1000),
})