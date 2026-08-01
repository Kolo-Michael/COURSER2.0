// In dev, point at the local FastAPI server on 127.0.0.1:8000.
// In prod (Vercel single project) the SPA and API share one origin, so all
// API paths carry an /api prefix and API_BASE_URL stays empty. Set
// VITE_API_BASE_URL to a different origin only if the deployments split.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Include HttpOnly auth cookies on every request.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
