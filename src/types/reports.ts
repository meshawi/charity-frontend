export type FilterFieldOption = {
  value: string | number
  label: string
}

export type FilterFieldType =
  | "text"
  | "number"
  | "date"
  | "enum"
  | "boolean"
  | "category"
  | "program"

export type FilterOperator = "eq" | "like" | "in" | "gte" | "lte" | "gt" | "lt"

export type FilterField = {
  key: string
  label: string
  type: FilterFieldType
  group: string
  operators: FilterOperator[]
  options?: FilterFieldOption[]
}

export type FilterFieldsResponse = {
  success: true
  fields: FilterField[]
}

export type ActiveFilter = {
  field: string
  op: FilterOperator
  value: string | number | boolean | (string | number)[]
}

export type FilterBeneficiariesRequest = {
  filters: ActiveFilter[]
  search?: string
  page?: number
  limit?: number
}

export type ExportBeneficiariesRequest = {
  filters: ActiveFilter[]
}

export type ExportProgramsRequest = {
  programIds: number[]
}

export type ExportEmployeesRequest = {
  userIds?: number[]
}
