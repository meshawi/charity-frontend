export type Permission = {
  name: string
  label: string
}

export type User = {
  id: number
  email: string
  nationalId: string
  name: string
  avatar: string | null
  isSuperAdmin: boolean
  createdAt: string
  roles: string[]
  permissions: Permission[]
}

export type LoginRequest = {
  email?: string
  nationalId?: string
  password: string
}

export type AuthResponse = {
  success: true
  message: string
  user: User
}

export type MeResponse = {
  success: true
  user: User
}
