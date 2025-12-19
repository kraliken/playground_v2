// lib/utils/tokenEstimate.js
export function estimateTokensFromChars(text) {
    const s = String(text || "");
    if (!s) return 0;
    return Math.ceil(s.length / 4);
}
