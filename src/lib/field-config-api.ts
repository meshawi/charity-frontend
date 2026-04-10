import { apiClient } from "@/lib/api-client"

export type FieldType = "text" | "number" | "date" | "select" | "boolean"

export type FieldConfigItem = {
  id: number
  fieldName: string
  fieldGroup: string
  fieldLabel: string
  isRequired: boolean
  isCustom: boolean
  fieldType: FieldType
  options: string[] | null
  isActive: boolean
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

export async function getFieldConfig(
  fieldGroup?: string,
  includeInactive?: boolean
) {
  const params = new URLSearchParams()
  if (fieldGroup) params.set("fieldGroup", fieldGroup)
  if (includeInactive) params.set("includeInactive", "true")
  const qs = params.toString()
  return apiClient<FieldConfigResponse>(`/field-config${qs ? `?${qs}` : ""}`)
}

export async function createCustomField(data: {
  fieldName: string
  fieldLabel: string
  fieldGroup: string
  fieldType?: FieldType
  options?: string[]
  isRequired?: boolean
}) {
  return apiClient<SingleFieldConfigResponse>("/field-config", {
    method: "POST",
    body: data,
  })
}

export async function updateFieldConfigBulk(
  updates: { id: number; isRequired: boolean }[]
) {
  return apiClient<FieldConfigResponse>("/field-config/bulk", {
    method: "PUT",
    body: { updates },
  })
}

export async function updateFieldConfig(
  id: number,
  data: {
    isRequired?: boolean
    fieldLabel?: string
    fieldType?: FieldType
    options?: string[]
    isActive?: boolean
  }
) {
  return apiClient<SingleFieldConfigResponse>(`/field-config/${id}`, {
    method: "PUT",
    body: data,
  })
}

export async function deleteCustomField(id: number) {
  return apiClient<{ success: true; message: string }>(`/field-config/${id}`, {
    method: "DELETE",
  })
}
