import { apiClient, API_BASE_URL } from "@/lib/api-client"
import type {
  LookupResponse,
  CreatePledgeResponse,
  PledgesListResponse,
} from "@/types/pledges"

export async function lookup(searchQuery: string) {
  return apiClient<LookupResponse>(
    `/pledges/lookup?searchQuery=${encodeURIComponent(searchQuery)}`
  )
}

export async function createPledge(data: {
  beneficiaryId: number
  signature: string
}) {
  return apiClient<CreatePledgeResponse>("/pledges", {
    method: "POST",
    body: data,
  })
}

export async function getPledges(params?: {
  search?: string
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const qs = searchParams.toString()
  return apiClient<PledgesListResponse>(`/pledges${qs ? `?${qs}` : ""}`)
}

export function getPdfUrl(pledgeId: number) {
  return `${API_BASE_URL}/pledges/${pledgeId}/pdf`
}
