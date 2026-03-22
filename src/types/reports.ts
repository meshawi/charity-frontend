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

export type FilterOperator = "eq" | "ne" | "like" | "in" | "gte" | "lte" | "gt" | "lt"

export type FilterFieldOperator = {
  value: FilterOperator
  label: string
}

export type FilterField = {
  key: string
  label: string
  type: FilterFieldType
  group: string
  operators: FilterFieldOperator[]
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
  disbursementStatus?: "received" | "not_received"
  page?: number
  limit?: number
}

export type ExportBeneficiariesRequest = {
  filters: ActiveFilter[]
  disbursementStatus?: "received" | "not_received"
}

export type ExportProgramsRequest = {
  programIds: number[]
}

export type ExportEmployeesRequest = {
  userIds?: number[]
}
