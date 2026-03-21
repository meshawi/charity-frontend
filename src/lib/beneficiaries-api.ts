import { apiClient } from "@/lib/api-client"
import type {
  BeneficiariesListResponse,
  BeneficiaryDetailResponse,
  BeneficiaryMutationResponse,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
  DeleteResponse,
  AssignCategoryRequest,
  AssignCategoryResponse,
  CategoryHistoryResponse,
} from "@/types/beneficiaries"

export async function getBeneficiaries(params?: {
  search?: string
  categoryId?: number
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.categoryId)
    searchParams.set("categoryId", String(params.categoryId))
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const qs = searchParams.toString()
  return apiClient<BeneficiariesListResponse>(
    `/beneficiaries${qs ? `?${qs}` : ""}`
  )
}

export async function getBeneficiary(id: number) {
  return apiClient<BeneficiaryDetailResponse>(`/beneficiaries/${id}`)
}

export async function createBeneficiary(data: CreateBeneficiaryRequest) {
  return apiClient<BeneficiaryMutationResponse>("/beneficiaries", {
    method: "POST",
    body: data,
  })
}

export async function updateBeneficiary(
  id: number,
  data: UpdateBeneficiaryRequest
) {
  return apiClient<BeneficiaryMutationResponse>(`/beneficiaries/${id}`, {
    method: "PUT",
    body: data,
  })
}

export async function deleteBeneficiary(id: number) {
  return apiClient<DeleteResponse>(`/beneficiaries/${id}`, {
    method: "DELETE",
  })
}

export async function assignCategory(
  id: number,
  data: AssignCategoryRequest
) {
  return apiClient<AssignCategoryResponse>(
    `/beneficiaries/${id}/category`,
    { method: "PUT", body: data }
  )
}

export async function getCategoryHistory(id: number) {
  return apiClient<CategoryHistoryResponse>(
    `/beneficiaries/${id}/category-history`
  )
}
