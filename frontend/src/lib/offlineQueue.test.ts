import { beforeEach, describe, expect, it, vi } from 'vitest';
import { offlineQueue } from './offlineQueue.js';

declare global {
  interface Window {
    localStorage: Storage;
  }
}

describe('offlineQueue', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    const localStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    (globalThis as any).window = { localStorage };
    offlineQueue.clear();
  });

  it('stores entries and persists to localStorage', () => {
    offlineQueue.enqueue({ orderId: 'o1', phone: '+2547001' });
    const snapshot = offlineQueue.snapshot();
    expect(snapshot).toHaveLength(1);
    const stored = Array.from(storage.values())[0];
    expect(stored).toMatch(/o1/);
  });

  it('flushes entries using provided sender', async () => {
    offlineQueue.enqueue({ orderId: 'o2', phone: '+2547002' });
    const sender = vi.fn().mockResolvedValue(undefined);

    const flushed = await offlineQueue.flush(sender);

    expect(flushed).toBe(1);
    expect(sender).toHaveBeenCalledWith({ orderId: 'o2', phone: '+2547002' });
    expect(offlineQueue.snapshot()).toHaveLength(0);
  });
});
