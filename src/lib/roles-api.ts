import { apiClient } from "@/lib/api-client"

export type RoleWithPermissions = {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  Permissions: {
    id: number
    name: string
    label: string
    description: string | null
  }[]
}

type RolesListResponse = {
  success: true
  roles: RoleWithPermissions[]
}

export async function getRoles() {
  return apiClient<RolesListResponse>("/roles")
}
