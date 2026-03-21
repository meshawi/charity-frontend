import { apiClient } from "@/lib/api-client"
import type {
  ProgramsListResponse,
  ProgramDetailResponse,
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramMutationResponse,
  DeleteResponse,
} from "@/types/programs"

export async function getPrograms(categoryId?: number) {
  const params = categoryId ? `?categoryId=${categoryId}` : ""
  return apiClient<ProgramsListResponse>(`/programs${params}`)
}

export async function getProgram(id: number) {
  return apiClient<ProgramDetailResponse>(`/programs/${id}`)
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
