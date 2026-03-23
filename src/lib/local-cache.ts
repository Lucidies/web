interface CacheRecord<T> {
  data: T;
  savedAt: number;
}

export interface CachedValue<T> {
  data: T;
  savedAt: number;
}

export function readLocalCache<T>(key: string): CachedValue<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheRecord<T>;
    if (!parsed || parsed.data === undefined || typeof parsed.savedAt !== 'number') {
      return null;
    }

    return {
      data: parsed.data,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function writeLocalCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: CacheRecord<T> = {
      data,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage errors (quota/private mode).
  }
}
