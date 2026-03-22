import { apiClient, API_BASE_URL } from "@/lib/api-client"
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
  SubmitReviewResponse,
  ReturnBeneficiaryResponse,
  ReviewQueueResponse,
  ProgressResponse,
  DocumentTypesResponse,
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

// --- V4: Review Workflow ---

export async function submitReview(id: number) {
  return apiClient<SubmitReviewResponse>(
    `/beneficiaries/${id}/submit-review`,
    { method: "POST" }
  )
}

export async function returnBeneficiary(id: number, note: string) {
  return apiClient<ReturnBeneficiaryResponse>(
    `/beneficiaries/${id}/return`,
    { method: "POST", body: { note } }
  )
}

export async function getReviewQueue(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const qs = searchParams.toString()
  return apiClient<ReviewQueueResponse>(
    `/beneficiaries/review-queue${qs ? `?${qs}` : ""}`
  )
}

// --- V4: Progress ---

export async function getProgress(id: number) {
  return apiClient<ProgressResponse>(`/beneficiaries/${id}/progress`)
}

// --- V4: Document Types ---

export async function getDocumentTypes(beneficiaryId: number) {
  return apiClient<DocumentTypesResponse>(
    `/beneficiaries/${beneficiaryId}/documents/types`
  )
}

export async function uploadDocument(
  beneficiaryId: number,
  file: File,
  type: string,
  notes?: string
) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", type)
  if (notes) formData.append("notes", notes)

  const response = await fetch(
    `${API_BASE_URL}/beneficiaries/${beneficiaryId}/documents`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  )
  const data = await response.json()
  if (!response.ok || !data.success) {
    const { ApiError } = await import("@/lib/api-client")
    throw new ApiError(
      response.status,
      data.code ?? "UNKNOWN_ERROR",
      data.message ?? "حدث خطأ في رفع المستند"
    )
  }
  return data
}

export async function deleteDocument(
  beneficiaryId: number,
  documentId: number
) {
  return apiClient<DeleteResponse>(
    `/beneficiaries/${beneficiaryId}/documents/${documentId}`,
    { method: "DELETE" }
  )
}

export function getDocumentViewUrl(
  beneficiaryId: number,
  documentId: number
) {
  return `${API_BASE_URL}/beneficiaries/${beneficiaryId}/documents/${documentId}/view`
}
