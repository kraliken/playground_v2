export function serverError(message = "Szerver hiba történt.") {
    return { ok: false, error: message }
}
