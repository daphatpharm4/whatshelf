const memoryCache = new Map<string, unknown>();

export const cache = {
  get<T>(key: string): T | undefined {
    return memoryCache.get(key) as T | undefined;
  },
  set<T>(key: string, value: T) {
    memoryCache.set(key, value);
  },
  delete(key: string) {
    memoryCache.delete(key);
  },
};
