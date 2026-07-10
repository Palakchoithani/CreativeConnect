"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = void 0;
const storage_blob_1 = require("@azure/storage-blob");
// Use the local Azurite emulator connection string by default
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const uploadFile = (containerName, blobName, buffer, mimeType) => __awaiter(void 0, void 0, void 0, function* () {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // Create container if it doesn't exist
    yield containerClient.createIfNotExists({ access: 'blob' });
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    yield blockBlobClient.uploadData(buffer, {
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
});
exports.uploadFile = uploadFile;
const deleteFile = (containerName, blobName) => __awaiter(void 0, void 0, void 0, function* () {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    yield blockBlobClient.deleteIfExists();
});
exports.deleteFile = deleteFile;
