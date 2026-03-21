import { apiClient } from "@/lib/api-client"
import type {
  FilterFieldsResponse,
  FilterBeneficiariesRequest,
  ExportBeneficiariesRequest,
  ExportProgramsRequest,
  ExportEmployeesRequest,
  ActiveFilter,
} from "@/types/reports"
import type { BeneficiariesListResponse } from "@/types/beneficiaries"

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

export async function getFilterFields() {
  return apiClient<FilterFieldsResponse>("/reports/filter-fields")
}

export async function filterBeneficiaries(data: FilterBeneficiariesRequest) {
  return apiClient<BeneficiariesListResponse>(
    "/reports/beneficiaries/filter",
    { method: "POST", body: data }
  )
}

async function downloadCSV(endpoint: string, body: unknown, filename: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message ?? "حدث خطأ في التصدير")
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportBeneficiaries(
  filters: ActiveFilter[],
  filename = "تقرير_المستفيدين.xlsx"
) {
  const data: ExportBeneficiariesRequest = { filters }
  return downloadCSV("/reports/beneficiaries/export", data, filename)
}

export async function exportPrograms(
  programIds: number[],
  filename = "تقرير_البرامج.xlsx"
) {
  const data: ExportProgramsRequest = { programIds }
  return downloadCSV("/reports/programs/export", data, filename)
}

export async function exportEmployees(
  userIds?: number[],
  filename = "تقرير_الموظفين.xlsx"
) {
  const data: ExportEmployeesRequest = userIds?.length ? { userIds } : {}
  return downloadCSV("/reports/employees/export", data, filename)
}
