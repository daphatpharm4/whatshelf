import { CosmosClient, type Container } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
});

const database = client.database(process.env.COSMOS_DB || 'whatshelf');

export const containers: Record<string, Container> = {
  merchants: database.container('merchants'),
  products: database.container('products'),
  orders: database.container('orders'),
  payments: database.container('payments'),
  receipts: database.container('receipts'),
  events: database.container('events'),
  idempo: database.container('idempotency'),
};

export const upsert = async <T>(name: keyof typeof containers, document: T, partitionKey: string) =>
  containers[name].items.upsert(document, { partitionKey });

export const readById = async <T>(name: keyof typeof containers, id: string, partitionKey: string) => {
  try {
    const { resource } = await containers[name].item(id, partitionKey).read<T>();
    return { resource };
  } catch (error: any) {
    if (error?.code === 404 || error?.statusCode === 404) {
      return { resource: undefined };
    }
    throw error;
  }
};
