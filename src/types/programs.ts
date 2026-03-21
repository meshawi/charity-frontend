export type ProgramCategory = {
  id: number
  name: string
  color: string
}

export type Program = {
  id: number
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  categories: ProgramCategory[]
}

export type CreateProgramRequest = {
  name: string
  description?: string
  categoryIds: number[]
  startDate?: string
  endDate?: string
}

export type UpdateProgramRequest = {
  name?: string
  description?: string
  categoryIds?: number[]
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export type ProgramsListResponse = {
  success: true
  programs: Program[]
}

export type ProgramDetailResponse = {
  success: true
  program: Program
}

export type ProgramMutationResponse = {
  success: true
  message: string
  program: Program
}

export type DeleteResponse = {
  success: true
  message: string
}
