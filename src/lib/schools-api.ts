import { apiClient } from "@/lib/api-client"
import type {
  DeleteSchoolRequest,
  ImportSchoolsResponse,
  SchoolMutationResponse,
  SchoolsListResponse,
} from "@/types/schools"

export async function getSchools() {
  return apiClient<SchoolsListResponse>("/schools")
}

export async function createSchool(name: string) {
  return apiClient<SchoolMutationResponse>("/schools", {
    method: "POST",
    body: { name },
  })
}

export async function updateSchool(id: number, name: string) {
  return apiClient<SchoolMutationResponse>(`/schools/${id}`, {
    method: "PUT",
    body: { name },
  })
}

/** `options` is only needed when the school still has dependents */
export async function deleteSchool(id: number, options?: DeleteSchoolRequest) {
  // Sent as query parameters — some proxies drop the body of a DELETE request
  const params = new URLSearchParams()
  if (options) {
    params.set("mode", options.mode)
    if (options.mode === "transfer") params.set("transferToId", String(options.transferToId))
  }
  const query = options ? `?${params.toString()}` : ""
  return apiClient<SchoolMutationResponse>(`/schools/${id}${query}`, {
    method: "DELETE",
  })
}

export async function importUnlistedSchools() {
  return apiClient<ImportSchoolsResponse>("/schools/import-unlisted", {
    method: "POST",
  })
}
