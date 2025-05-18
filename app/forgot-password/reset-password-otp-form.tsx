"use client"

import { useState, useEffect } from "react"
import { verifyPasswordResetOTP } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ResetPasswordForm from "./reset-password-form"

export default function ResetPasswordOTPForm({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [previewOTP, setPreviewOTP] = useState<string | null>(null)

  // For preview mode, fetch the OTP from the store
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // This is a client-side only operation
      const checkForStoredOTP = async () => {
        try {
          const response = await fetch(`/api/preview-otp?email=${encodeURIComponent(email)}`)
          const data = await response.json()
          if (data.otp) {
            setPreviewOTP(data.otp)
          }
        } catch (error) {
          console.error("Failed to fetch preview OTP:", error)
        }
      }

      // Only in development/preview
      if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview") {
        checkForStoredOTP()
      }
    }
  }, [email])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await verifyPasswordResetOTP(formData)

      if (result.success) {
        setVerified(true)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // If OTP is verified, show the password reset form
  if (verified) {
    return <ResetPasswordForm email={email} />
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-center mb-4">Verify Reset Code</h2>
        <p className="text-muted-foreground text-center mb-6">
          We sent a verification code to <span className="font-medium">{email}</span>
        </p>

        {previewOTP && (
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Preview Mode:</strong> Use this OTP for testing:{" "}
              <code className="bg-muted p-1 rounded">{previewOTP}</code>
            </AlertDescription>
          </Alert>
        )}

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <input type="hidden" name="email" value={email} />

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              required
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
