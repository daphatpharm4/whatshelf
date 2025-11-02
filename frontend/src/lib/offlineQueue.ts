type PaymentPayload = {
  orderId: string;
  phone: string;
};

type QueueItem = {
  id: string;
  createdAt: string;
  payload: PaymentPayload;
};

const STORAGE_KEY = 'whatshelf.offline.queue';

const loadQueue = (): QueueItem[] => {
  try {
    const raw = window?.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as QueueItem[];
    }
  } catch (error) {
    console.warn('Unable to load offline queue', error);
  }
  return [];
};

const persistQueue = (queue: QueueItem[]) => {
  try {
    window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Unable to persist offline queue', error);
  }
};

let queueCache: QueueItem[] | undefined;

const getQueue = (): QueueItem[] => {
  if (!queueCache) {
    queueCache = loadQueue();
  }
  return queueCache;
};

export const offlineQueue = {
  enqueue(payload: PaymentPayload) {
    const queue = getQueue();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const item: QueueItem = { id, createdAt: new Date().toISOString(), payload };
    queue.push(item);
    persistQueue(queue);
    return item.id;
  },
  async flush(sender: (payload: PaymentPayload) => Promise<void>) {
    const queue = getQueue();
    const successes: string[] = [];
    for (const entry of queue) {
      try {
        await sender(entry.payload);
        successes.push(entry.id);
      } catch (error) {
        console.warn('Failed to flush offline payment', error);
        break;
      }
    }
    if (successes.length > 0) {
      queueCache = queue.filter((item) => !successes.includes(item.id));
      persistQueue(queueCache);
    }
    return successes.length;
  },
  snapshot(): QueueItem[] {
    return [...getQueue()];
  },
  clear() {
    queueCache = [];
    persistQueue([]);
  },
};
