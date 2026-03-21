import * as React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoaderCircle } from "lucide-react"

type LoginMethod = "email" | "nationalId"

export default function LoginPage() {
  const auth = useAuth()
  const [method, setMethod] = React.useState<LoginMethod>("email")
  const [email, setEmail] = React.useState("")
  const [nationalId, setNationalId] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  if (auth.status === "authenticated") {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await auth.login({
        ...(method === "email" ? { email } : { nationalId }),
        password,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            قم بتسجيل الدخول للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={method === "email" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setMethod("email")}
              >
                البريد الإلكتروني
              </Button>
              <Button
                type="button"
                variant={method === "nationalId" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setMethod("nationalId")}
              >
                رقم الهوية
              </Button>
            </div>

            {method === "email" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  dir="ltr"
                  className="text-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nationalId">رقم الهوية</Label>
                <Input
                  id="nationalId"
                  type="text"
                  inputMode="numeric"
                  placeholder="1234567890"
                  dir="ltr"
                  className="text-left"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                className="text-left"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <LoaderCircle className="animate-spin" />
              )}
              تسجيل الدخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
