export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown[]

  constructor(status: number, code: string, message: string, details?: unknown[]) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new ApiError(
      response.status,
      data.code ?? "UNKNOWN_ERROR",
      data.message ?? "حدث خطأ غير متوقع",
      data.details
    )
  }

  return data as T
}
