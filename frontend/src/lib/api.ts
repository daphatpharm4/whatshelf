import { cache } from './cache.js';

export const API = import.meta.env.VITE_API_BASE ?? '';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? 'GET';
  const cacheKey = `${method}:${path}`;
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (offline && method === 'GET') {
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as T;
  if (method === 'GET') {
    cache.set(cacheKey, payload);
  }
  return payload;
}
