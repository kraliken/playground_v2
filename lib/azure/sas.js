
import "server-only";

import {
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    ContainerSASPermissions,
} from "@azure/storage-blob";

export function getContainerSasUrl({ accountName, accountKey, containerName, expiresInMinutes = 15 }) {
    const sharedKey = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + expiresInMinutes * 60_000);
    const permissions = ContainerSASPermissions.parse("wlcr");

    const sas = generateBlobSASQueryParameters({ containerName, expiresOn, permissions }, sharedKey).toString();

    return `https://${accountName}.blob.core.windows.net/${containerName}?${sas}`;
}