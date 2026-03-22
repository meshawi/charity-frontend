import { apiClient } from "@/lib/api-client"
import type {
  ProgramsListResponse,
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramMutationResponse,
  DeleteResponse,
} from "@/types/programs"
import type { ProgramRecipientsFilterResponse } from "@/types/disbursements"

export async function getPrograms(categoryId?: number) {
  const params = categoryId ? `?categoryId=${categoryId}` : ""
  return apiClient<ProgramsListResponse>(`/programs${params}`)
}

export async function createProgram(data: CreateProgramRequest) {
  return apiClient<ProgramMutationResponse>("/programs", {
    method: "POST",
    body: data,
  })
}

export async function updateProgram(
  id: number,
  data: UpdateProgramRequest
) {
  return apiClient<ProgramMutationResponse>(`/programs/${id}`, {
    method: "PUT",
    body: data,
  })
}

export async function deleteProgram(id: number) {
  return apiClient<DeleteResponse>(`/programs/${id}`, {
    method: "DELETE",
  })
}

export async function getProgramBeneficiaries(
  programId: number,
  params?: {
    status?: "received" | "eligible"
    search?: string
    page?: number
    limit?: number
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set("status", params.status)
  if (params?.search) searchParams.set("search", params.search)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const qs = searchParams.toString()
  return apiClient<ProgramRecipientsFilterResponse>(
    `/programs/${programId}/beneficiaries${qs ? `?${qs}` : ""}`
  )
}
