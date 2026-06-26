// In dev, point at the local FastAPI server on 127.0.0.1:8000.
// In prod (Vercel), set VITE_API_BASE_URL to the deployed API's origin
// (e.g. https://courser-api.vercel.app). When the variable is unset in prod
// we fall back to the same-origin default so cookies/proxy setups work.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
