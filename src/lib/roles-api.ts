import { apiClient } from "@/lib/api-client"

export type PermissionItem = {
  id: number
  name: string
  label: string
  description: string | null
}

export type RoleWithPermissions = {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  Permissions: PermissionItem[]
}

type PermissionsListResponse = {
  success: true
  permissions: PermissionItem[]
}

type RolesListResponse = {
  success: true
  roles: RoleWithPermissions[]
}

type RoleMutationResponse = {
  success: true
  role: RoleWithPermissions
}

type DeleteResponse = {
  success: true
  message: string
}

export async function getPermissions() {
  return apiClient<PermissionsListResponse>("/roles/permissions")
}

export async function getRoles() {
  return apiClient<RolesListResponse>("/roles")
}

export async function createRole(data: {
  name: string
  description?: string
  permissionIds: number[]
}) {
  return apiClient<RoleMutationResponse>("/roles", {
    method: "POST",
    body: data,
  })
}

export async function updateRole(
  id: number,
  data: {
    name?: string
    description?: string
    permissionIds?: number[]
  }
) {
  return apiClient<RoleMutationResponse>(`/roles/${id}`, {
    method: "PUT",
    body: data,
  })
}

export async function deleteRole(id: number) {
  return apiClient<DeleteResponse>(`/roles/${id}`, {
    method: "DELETE",
  })
}
