export function toSafeBlobName(filename) {
    const name = (filename || "file.pdf")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
    return name.length > 0 ? name : "file.pdf";
}