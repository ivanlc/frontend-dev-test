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

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal })

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  return (await response.json()) as T
}
