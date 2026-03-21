import * as React from "react"
import { useNavigate } from "react-router-dom"
import type { User } from "@/types/auth"
import type { LoginRequest } from "@/types/auth"
import * as authApi from "@/lib/auth-api"

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" }

type AuthContextValue = AuthState & {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: "loading" })
  const navigate = useNavigate()

  React.useEffect(() => {
    authApi
      .getMe()
      .then((user) => {
        if (user) {
          setState({ status: "authenticated", user })
        } else {
          setState({ status: "unauthenticated" })
        }
      })
      .catch(() => {
        setState({ status: "unauthenticated" })
      })
  }, [])

  const login = React.useCallback(
    async (credentials: LoginRequest) => {
      const user = await authApi.login(credentials)
      setState({ status: "authenticated", user })
      navigate("/", { replace: true })
    },
    [navigate]
  )

  const logout = React.useCallback(async () => {
    await authApi.logout()
    setState({ status: "unauthenticated" })
    navigate("/login", { replace: true })
  }, [navigate])

  const hasPermission = React.useCallback(
    (permission: string) => {
      if (state.status !== "authenticated") return false
      return state.user.permissions.some((p) => p.name === permission)
    },
    [state]
  )

  const value = React.useMemo<AuthContextValue>(() => {
    return { ...state, login, logout, hasPermission }
  }, [state, login, logout, hasPermission])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
