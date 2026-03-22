import { apiClient } from "@/lib/api-client"
import type {
  CategoriesListResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryMutationResponse,
  DeleteResponse,
} from "@/types/categories"

export async function getCategories() {
  return apiClient<CategoriesListResponse>("/categories")
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
