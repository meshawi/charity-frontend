import { apiClient } from "@/lib/api-client"
import type {
  CategoriesListResponse,
  CategoryDetailResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryMutationResponse,
  DeleteResponse,
} from "@/types/categories"

export async function getCategories() {
  return apiClient<CategoriesListResponse>("/categories")
}

export async function getCategory(id: number) {
  return apiClient<CategoryDetailResponse>(`/categories/${id}`)
}

export async function createCategory(data: CreateCategoryRequest) {
  return apiClient<CategoryMutationResponse>("/categories", {
    method: "POST",
    body: data,
  })
}

export async function updateCategory(
  id: number,
  data: UpdateCategoryRequest
) {
  return apiClient<CategoryMutationResponse>(`/categories/${id}`, {
    method: "PUT",
    body: data,
  })
}

export async function deleteCategory(id: number) {
  return apiClient<DeleteResponse>(`/categories/${id}`, {
    method: "DELETE",
  })
}
