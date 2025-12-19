export function pickCitationsForUi(retrieved, { max = 2, delta = 0.03, minScore = 0.0 } = {}) {
    if (!Array.isArray(retrieved) || retrieved.length === 0) return []

    const sorted = [...retrieved].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    const best = sorted[0]?.score ?? 0

    const filtered = sorted.filter((r) => {
        const s = r.score ?? 0
        return s >= minScore && s >= best - delta
    })

    const safe = filtered.length ? filtered : sorted.slice(0, 1)
    return safe.slice(0, max)
}