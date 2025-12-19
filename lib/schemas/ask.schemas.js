import { z } from "zod"

export const AskSchema = z.object({
    topicId: z.string().min(1),
    question: z.string().min(3).max(1000),
    topK: z.coerce.number().int().min(1).max(12).default(6),

    maxContextChars: z.coerce.number().int().min(2000).max(20000).default(9000),

    maxUiCitations: z.coerce.number().int().min(1).max(6).default(2),
    uiScoreDelta: z.coerce.number().min(0).max(1).default(0.03),
    uiMinScore: z.coerce.number().min(0).max(1).default(0.0),

    scopeSubTitle: z.string().max(200).optional(),

    chatHistoryJson: z.string().optional(),
})