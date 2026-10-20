const DEFAULT_API_BASE_URL = 'https://itx-frontend-test.onrender.com'

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`API request failed: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init)

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  return (await response.json()) as T
}

export function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(path, { signal })
}

export function postJson<TResponse, TBody>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
