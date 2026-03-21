import { apiClient, ApiError } from "@/lib/api-client"
import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  User,
} from "@/types/auth"

export async function login(credentials: LoginRequest): Promise<User> {
  const data = await apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  })
  return data.user
}

export async function logout(): Promise<void> {
  await apiClient("/auth/logout", { method: "POST" })
}

export async function getMe(): Promise<User | null> {
  try {
    const data = await apiClient<MeResponse>("/auth/me")
    return data.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}
