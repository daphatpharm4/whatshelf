import { BlobServiceClient } from '@azure/storage-blob';

const blobService = BlobServiceClient.fromConnectionString(process.env.BLOB_CONN!);
const container = blobService.getContainerClient('public');
await container.createIfNotExists();

export const uploadPdf = async (buffer: Buffer, path: string) => {
  const client = container.getBlockBlobClient(path);
  await client.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: 'application/pdf' },
  });
  return client.url;
};
