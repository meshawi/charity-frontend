import { apiClient } from "@/lib/api-client"
import type {
  UsersListResponse,
  UserDetailResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  ResetPasswordResponse,
} from "@/types/users"

export async function getUsers() {
  return apiClient<UsersListResponse>("/users")
}

export async function getUser(id: number) {
  return apiClient<UserDetailResponse>(`/users/${id}`)
}

export async function createUser(data: CreateUserRequest) {
  return apiClient<CreateUserResponse>("/users", {
    method: "POST",
    body: data,
  })
}

export async function updateUser(id: number, data: UpdateUserRequest) {
  return apiClient<UpdateUserResponse>(`/users/${id}`, {
    method: "PUT",
    body: data,
  })
}

export async function resetUserPassword(id: number, newPassword: string) {
  return apiClient<ResetPasswordResponse>(`/users/${id}/reset-password`, {
    method: "POST",
    body: { newPassword },
  })
}

export async function changeOwnPassword(newPassword: string) {
  return apiClient<{ success: true; message: string }>(
    "/users/me/change-password",
    {
      method: "POST",
      body: { newPassword },
    }
  )
}
