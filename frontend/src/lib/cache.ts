const memoryCache = new Map<string, unknown>();
const STORAGE_KEY = 'whatshelf.cache';

const ensureCacheLoaded = () => {
  if (memoryCache.size > 0) return;
  try {
    const raw = window?.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [key, value] of Object.entries(parsed)) {
        memoryCache.set(key, value);
      }
    }
  } catch (error) {
    console.warn('Unable to hydrate cache', error);
  }
};

const persist = () => {
  try {
    const entries = Object.fromEntries(memoryCache.entries());
    window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Unable to persist cache', error);
  }
};

export const cache = {
  get<T>(key: string): T | undefined {
    ensureCacheLoaded();
    return memoryCache.get(key) as T | undefined;
  },
  set<T>(key: string, value: T) {
    memoryCache.set(key, value);
    persist();
  },
  delete(key: string) {
    memoryCache.delete(key);
    persist();
  },
};
