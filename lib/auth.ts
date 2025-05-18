import { db, initDatabase } from "./db"
import { users, otps, type NewOTP } from "./db/schema"
import { eq, and } from "drizzle-orm"
import { sendEmail } from "./email"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_please_change_in_production")

// Initialize database flag
let dbInitialized = false

// Helper function to ensure database is initialized
async function ensureDbInitialized() {
  if (!dbInitialized) {
    dbInitialized = await initDatabase()
  }
  return dbInitialized
}

// Generate a random OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create and send OTP
export async function createAndSendOTP(
  email: string,
  type: "verification" | "passwordReset" | "loginVerification",
): Promise<boolean> {
  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    // Generate a new OTP
    const otpCode = generateOTP()

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Delete any existing OTPs for this email and type
    await db.delete(otps).where(and(eq(otps.email, email), eq(otps.type, type)))

    // Create a new OTP record
    const newOTP: NewOTP = {
      email,
      otp: otpCode,
      type,
      expiresAt,
    }

    await db.insert(otps).values(newOTP)

    // Send the OTP via email
    const emailTemplate =
      type === "verification" ? "verification" : type === "passwordReset" ? "passwordReset" : "loginVerification"

    const emailResult = await sendEmail(email, emailTemplate, otpCode)

    return emailResult.success
  } catch (error) {
    console.error("Error creating and sending OTP:", error)
    return false
  }
}

// Verify OTP
export async function verifyOTP(
  email: string,
  otpCode: string,
  type: "verification" | "passwordReset" | "loginVerification",
): Promise<boolean> {
  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    const now = new Date()

    // Find the OTP record - using direct select instead of query builder
    const otpResults = await db
      .select()
      .from(otps)
      .where(and(eq(otps.email, email), eq(otps.otp, otpCode), eq(otps.type, type)))
      .limit(1)

    const otpRecord = otpResults.length > 0 ? otpResults[0] : null

    // Check if OTP exists and is not expired
    if (!otpRecord || otpRecord.expiresAt < now) {
      return false
    }

    // Delete the used OTP
    await db.delete(otps).where(eq(otps.id, otpRecord.id))

    // If it's a verification OTP, mark the user's email as verified
    if (type === "verification") {
      await db.update(users).set({ emailVerified: true }).where(eq(users.email, email))
    }

    return true
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return false
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Create a JWT token
export async function createToken(userId: number, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)

  return token
}

// Set the token in cookies
export function setTokenCookie(token: string): void {
  cookies().set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

// Get the current user from the token
export async function getCurrentUser() {
  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    const token = cookies().get("auth_token")?.value

    if (!token) {
      return null
    }

    const verified = await jwtVerify(token, JWT_SECRET)
    const userId = verified.payload.userId as number

    // Find the user - using direct select instead of query builder
    const userResults = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const user = userResults.length > 0 ? userResults[0] : null

    if (!user) {
      return null
    }

    // Don't return the password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Logout user
export function logout() {
  cookies().delete("auth_token")
}

// Auth middleware
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
