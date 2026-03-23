export interface ApiErrorDetails {
  message: string;
  code?: string;
  status?: number;
  retryAfter?: number;
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  retryAfter?: number;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.code = details.code;
    this.status = details.status;
    this.retryAfter = details.retryAfter;
  }
}

interface FetchJsonOptions {
  timeoutMs?: number;
}

interface ApiErrorPayload {
  error?: string;
  message?: string;
  code?: string;
  retryAfter?: number;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;
  return undefined;
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  options?: FetchJsonOptions
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      let payload: ApiErrorPayload | null = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      throw new ApiError({
        message:
          payload?.error ||
          payload?.message ||
          `Request failed (${response.status})`,
        code: payload?.code,
        status: response.status,
        retryAfter:
          payload?.retryAfter ?? parseRetryAfter(response.headers.get('Retry-After')),
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
      });
    }

    throw new ApiError({
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'UNKNOWN',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
