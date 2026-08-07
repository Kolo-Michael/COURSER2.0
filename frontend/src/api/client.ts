// The SPA and API share one origin: in dev a Vite proxy forwards /api to
// the local FastAPI server (see vite.config.ts), and in prod (Vercel single
// project) they're literally the same origin. Keep API_BASE_URL empty so
// cookies stay same-origin and readable by getSession(). Set
// VITE_API_BASE_URL to a different origin only if the deployments split.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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
    const readable = readableError(message, response.status)
    throw new Error(readable || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/** Turn FastAPI/DRF-style error bodies into a readable single line. */
function readableError(body: string, status: number): string | null {
  try {
    const data = JSON.parse(body)
    if (Array.isArray(data.detail)) {
      // Pydantic 422: [{ loc, msg, input }]
      const parts = data.detail.map((item: { loc?: unknown[]; msg?: string }) => {
        const field = Array.isArray(item.loc) && item.loc.length > 0 ? item.loc[item.loc.length - 1] : null
        return field ? `${field}: ${item.msg ?? 'invalid value'}` : item.msg ?? 'invalid value'
      })
      return parts.join('; ')
    }
    if (typeof data.detail === 'string') return data.detail
    return null
  } catch {
    return status >= 500 ? null : body || null
  }
}
