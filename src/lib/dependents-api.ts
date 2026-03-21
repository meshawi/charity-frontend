import { apiClient } from "@/lib/api-client"
import type {
  DependentsListResponse,
  DependentMutationResponse,
  CreateDependentRequest,
  UpdateDependentRequest,
  DeleteResponse,
} from "@/types/beneficiaries"

export async function getDependents(beneficiaryId: number) {
  return apiClient<DependentsListResponse>(
    `/beneficiaries/${beneficiaryId}/dependents`
  )
}

export async function createDependent(
  beneficiaryId: number,
  data: CreateDependentRequest
) {
  return apiClient<DependentMutationResponse>(
    `/beneficiaries/${beneficiaryId}/dependents`,
    { method: "POST", body: data }
  )
}

export async function updateDependent(
  beneficiaryId: number,
  dependentId: number,
  data: UpdateDependentRequest
) {
  return apiClient<DependentMutationResponse>(
    `/beneficiaries/${beneficiaryId}/dependents/${dependentId}`,
    { method: "PUT", body: data }
  )
}

export async function deleteDependent(
  beneficiaryId: number,
  dependentId: number
) {
  return apiClient<DeleteResponse>(
    `/beneficiaries/${beneficiaryId}/dependents/${dependentId}`,
    { method: "DELETE" }
  )
}
