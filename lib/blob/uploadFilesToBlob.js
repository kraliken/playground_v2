import { toSafeBlobName } from "./toSafeBlobName";

export async function uploadFilesToBlob({ files, containerSasUrl, prefix, concurrency = 6, onProgress }) {
    const base = containerSasUrl.split("?")[0];
    const sas = containerSasUrl.split("?")[1];

    const queue = [...files];
    let active = 0;
    let done = 0;

    const uploaded = [];

    const uploadOne = async (file) => {
        const safeName = toSafeBlobName(file.name);
        const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}-`;
        const blobName = `${prefix}${unique}${safeName}`;
        const blobUrl = `${base}/${encodeURIComponent(blobName)}?${sas}`;

        const res = await fetch(blobUrl, {
            method: "PUT",
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "Content-Type": "application/pdf",
            },
            body: file,
        });

        if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`Upload failed (${res.status}): ${t}`);
        }

        uploaded.push({ originalName: file.name, blobName });
    };

    await new Promise((resolve, reject) => {
        const tick = () => {
            while (active < concurrency && queue.length > 0) {
                const f = queue.shift();
                active++;

                uploadOne(f)
                    .then(() => {
                        active--;
                        done++;
                        onProgress?.({ done, total: files.length });
                        tick();
                    })
                    .catch(reject);
            }

            if (queue.length === 0 && active === 0) resolve();
        };

        tick();
    });

    return uploaded;
}