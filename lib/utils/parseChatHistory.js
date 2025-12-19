export function parseChatHistory(chatHistoryJson) {
    if (!chatHistoryJson) return []
    try {
        const raw = JSON.parse(chatHistoryJson)
        if (!Array.isArray(raw)) return []
        const trimmed = raw.slice(-6)
        const parsed = z.array(ChatHistoryItemSchema).safeParse(trimmed)
        if (!parsed.success) return []
        return parsed.data
    } catch {
        return []
    }
}