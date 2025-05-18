import { type NextRequest, NextResponse } from "next/server"
import { getStoredOTP } from "@/lib/email"

export async function GET(request: NextRequest) {
  // Only allow this in development or preview environments
  if (process.env.NODE_ENV !== "development" && process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
  }

  const otp = getStoredOTP(email)

  return NextResponse.json({ otp })
}
