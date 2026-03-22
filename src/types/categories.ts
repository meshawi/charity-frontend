export type Category = {
  id: number
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
  programs?: CategoryProgram[]
  programCount?: number
}

export type CategoryProgram = {
  id: number
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateCategoryRequest = {
  name: string
  description?: string
  color: string
}

export type UpdateCategoryRequest = {
  name?: string
  description?: string
  color?: string
}

export type CategoriesListResponse = {
  success: true
  categories: Category[]
}

export type CategoryDetailResponse = {
  success: true
  category: Category
}

export type CategoryMutationResponse = {
  success: true
  message: string
  category: Category
}

export type DeleteResponse = {
  success: true
  message: string
}
