import { apiClient } from "@/lib/api-client"

export type FieldConfigItem = {
  id: number
  fieldName: string
  fieldGroup: string
  fieldLabel: string
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

type FieldConfigResponse = {
  success: true
  configs: FieldConfigItem[]
}

type SingleFieldConfigResponse = {
  success: true
  config: FieldConfigItem
}

export async function getFieldConfig(fieldGroup?: string) {
  const qs = fieldGroup ? `?fieldGroup=${fieldGroup}` : ""
  return apiClient<FieldConfigResponse>(`/field-config${qs}`)
}

export async function updateFieldConfigBulk(
  updates: { id: number; isRequired: boolean }[]
) {
  return apiClient<FieldConfigResponse>("/field-config/bulk", {
    method: "PUT",
    body: { updates },
  })
}

export async function updateFieldConfig(id: number, isRequired: boolean) {
  return apiClient<SingleFieldConfigResponse>(`/field-config/${id}`, {
    method: "PUT",
    body: { isRequired },
  })
}
