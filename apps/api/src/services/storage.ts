import { BlobServiceClient } from '@azure/storage-blob';

// Use the local Azurite emulator connection string by default
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

export const uploadFile = async (containerName: string, blobName: string, buffer: Buffer, mimeType: string) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Create container if it doesn't exist
  await containerClient.createIfNotExists({ access: 'blob' });

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType }
  });

  const rawUrl = blockBlobClient.url;
  
  // If Azure CDN is configured, rewrite the URL to use the global Edge Network
  if (process.env.AZURE_CDN_URL) {
    const urlObj = new URL(rawUrl);
    // Replace the blob.core.windows.net hostname with the CDN hostname
    return rawUrl.replace(urlObj.origin, process.env.AZURE_CDN_URL);
  }

  return rawUrl;
};

export const deleteFile = async (containerName: string, blobName: string) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};
