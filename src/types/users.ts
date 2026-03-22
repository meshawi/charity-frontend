export type Role = {
  id: number
  name: string
}

export type AdminUser = {
  id: number
  email: string
  nationalId: string
  name: string
  avatar: string | null
  isActive: boolean
  isSuperAdmin: boolean
  createdAt: string
  Roles: Role[]
}

export type AdminUserDetail = {
  id: number
  email: string
  nationalId: string
  name: string
  isActive: boolean
  createdAt: string
  Roles: Role[]
}

export type CreateUserRequest = {
  email: string
  nationalId?: string
  password: string
  name: string
  roleIds: number[]
}

export type UpdateUserRequest = {
  email?: string
  nationalId?: string
  name?: string
  isActive?: boolean
  roleIds?: number[]
}

export type UsersListResponse = {
  success: true
  users: AdminUser[]
}

export type UserDetailResponse = {
  success: true
  user: AdminUserDetail
}

export type CreateUserResponse = {
  success: true
  message: string
  user: {
    id: number
    email: string
    nationalId: string
    name: string
    isActive: boolean
    roles: string[]
  }
}

export type UpdateUserResponse = {
  success: true
  message: string
  user: {
    id: number
    email: string
    nationalId: string
    name: string
    isActive: boolean
    roles: Role[]
  }
}

export type ResetPasswordResponse = {
  success: true
  message: string
}
