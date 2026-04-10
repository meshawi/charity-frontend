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
  CardHeader,
} from "@/components/ui/card"
import { LoaderCircle } from "lucide-react"

type LoginMethod = "email" | "nationalId"

const brandName =
  import.meta.env.VITE_BRAND_NAME || "نظام إدارة الجمعية"
const brandDescription = import.meta.env.VITE_BRAND_DESCRIPTION
const devName = import.meta.env.VITE_DEV_NAME
const devUrl = import.meta.env.VITE_DEV_URL

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
    <div className="flex min-h-svh flex-col bg-muted/30">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-lg">
          {/* Branding side */}
          <div className="hidden w-[45%] flex-col items-center justify-center gap-6 bg-primary/5 p-10 md:flex">
            <img
              src="/brandbig.png"
              alt={brandName}
              className="max-h-44 w-auto object-contain"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
            <div className="space-y-2 text-center">
              <h1 className="text-lg font-semibold">{brandName}</h1>
              {brandDescription && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {brandDescription}
                </p>
              )}
            </div>
          </div>

          {/* Form side */}
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-10 ">
            {/* Mobile brand header */}
            <div className="mb-6 flex flex-col items-center gap-3 md:hidden">
              <img
                src="/brandbig.png"
                alt={brandName}
                className="max-h-24 w-auto object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
              <h1 className="text-base font-semibold">{brandName}</h1>
            </div>

            <Card className="border-0 shadow-none p-5">
              <CardHeader className="px-0 pt-0 text-center">
                <h2 className="text-xl font-semibold">تسجيل الدخول</h2>
                <p className="text-sm text-muted-foreground">
                  قم بتسجيل الدخول للوصول إلى لوحة التحكم
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
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
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                          setNationalId(v)
                        }}
                        maxLength={10}
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

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && (
                      <LoaderCircle className="animate-spin" />
                    )}
                    تسجيل الدخول
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      {devName && (
        <div className="py-4 text-center text-xs text-muted-foreground">
          تم تطويره بواسطة{" "}
          {devUrl ? (
            <a
              href={devUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {devName}
            </a>
          ) : (
            <span className="font-medium">{devName}</span>
          )}
        </div>
      )}
    </div>
  )
}
