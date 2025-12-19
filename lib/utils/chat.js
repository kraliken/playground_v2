export function appendHistoryToUserPrompt(userPrompt, history) {
    if (!history?.length) return userPrompt

    const lines = history.map((m) => {
        const role = m.role === "user" ? "USER" : "ASSISTANT"
        return `${role}: ${m.text}`
    })

    const block = ["BESZÉLGETÉS ELŐZMÉNY (csak kontextus, nem forrás):", lines.join("\n"), ""].join("\n")
    return `${block}${userPrompt}`
}