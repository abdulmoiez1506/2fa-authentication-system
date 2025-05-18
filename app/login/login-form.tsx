"use client"

import { useState } from "react"
import Link from "next/link"
import { loginUser } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import VerifyEmailForm from "../verify-email/verify-email-form"
import LoginOTPForm from "./login-otp-form"

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [requiresOTP, setRequiresOTP] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await loginUser(formData)

      if (result.success) {
        if (result.requiresOTP && result.email) {
          setRequiresOTP(true)
          setEmail(result.email)
        }
      } else {
        setError(result.message)

        if (result.needsVerification && result.email) {
          setNeedsVerification(true)
          setEmail(result.email)
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // If email needs verification, show the verification form
  if (needsVerification && email) {
    return <VerifyEmailForm email={email} />
  }

  // If login requires OTP, show the OTP form
  if (requiresOTP && email) {
    return <LoginOTPForm email={email} />
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="john@example.com" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>

          <div className="text-center text-sm mt-4">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
