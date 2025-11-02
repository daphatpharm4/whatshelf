import { QueueClient } from '@azure/storage-queue';

const queueClient = new QueueClient(process.env.QUEUE_CONN!, 'jobs');
await queueClient.createIfNotExists();

export const enqueue = async (type: string, payload: unknown, visibilityTimeout = 0) => {
  const message = Buffer.from(
    JSON.stringify({ type, payload, ts: Date.now() }),
  ).toString('base64');

  await queueClient.sendMessage(message, { visibilityTimeout });
};
