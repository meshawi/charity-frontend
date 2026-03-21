import { apiClient } from "@/lib/api-client"
import type {
  ActiveProgramsResponse,
  EligibilityResponse,
  CreateDisbursementRequest,
  CreateDisbursementResponse,
  DisbursementsListResponse,
  DisbursementDetailResponse,
  BeneficiaryDisbursementsResponse,
  ProgramRecipientsResponse,
} from "@/types/disbursements"

export async function getActivePrograms() {
  return apiClient<ActiveProgramsResponse>(
    "/disbursements/active-programs"
  )
}

export async function checkEligibility(
  programId: number,
  searchQuery: string
) {
  return apiClient<EligibilityResponse>(
    "/disbursements/check-eligibility",
    {
      method: "POST",
      body: { programId, searchQuery },
    }
  )
}

export async function createDisbursement(data: CreateDisbursementRequest) {
  return apiClient<CreateDisbursementResponse>("/disbursements", {
    method: "POST",
    body: data,
  })
}

export async function getDisbursements(params?: {
  search?: string
  programId?: number
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.programId)
    searchParams.set("programId", String(params.programId))
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const qs = searchParams.toString()
  return apiClient<DisbursementsListResponse>(
    `/disbursements${qs ? `?${qs}` : ""}`
  )
}

export async function getDisbursement(id: number) {
  return apiClient<DisbursementDetailResponse>(`/disbursements/${id}`)
}

export async function getBeneficiaryDisbursements(beneficiaryId: number) {
  return apiClient<BeneficiaryDisbursementsResponse>(
    `/disbursements/beneficiary/${beneficiaryId}`
  )
}

export async function getProgramRecipients(
  programId: number,
  params?: { search?: string; page?: number; limit?: number }
) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const qs = searchParams.toString()
  return apiClient<ProgramRecipientsResponse>(
    `/disbursements/program/${programId}/recipients${qs ? `?${qs}` : ""}`
  )
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

export function getAcknowledgmentUrl(disbursementId: number) {
  return `${API_BASE_URL}/disbursements/${disbursementId}/pdf`
}
