"use server"

import { db, initDatabase } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  hashPassword,
  verifyPassword,
  createAndSendOTP,
  verifyOTP,
  createToken,
  setTokenCookie,
  logout as logoutUser,
} from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Add this line to export the createAndSendOTP function
export { createAndSendOTP }

// Initialize database flag
let dbInitialized = false

// Helper function to ensure database is initialized
async function ensureDbInitialized() {
  if (!dbInitialized) {
    dbInitialized = await initDatabase()
  }
  return dbInitialized
}

// Register a new user
export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    // Check if user already exists - using direct select instead of query builder
    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const existingUser = existingUsers.length > 0 ? existingUsers[0] : null

    if (existingUser) {
      return { success: false, message: "User with this email already exists" }
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create the user
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
    })

    // Send verification OTP
    const otpSent = await createAndSendOTP(email, "verification")

    if (!otpSent) {
      return { success: false, message: "Failed to send verification email" }
    }

    return {
      success: true,
      message: "Registration successful! Please check your email for verification code.",
      email,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, message: "An error occurred during registration" }
  }
}

// Verify email with OTP
export async function verifyEmail(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    const verified = await verifyOTP(email, otp, "verification")

    if (!verified) {
      return { success: false, message: "Invalid or expired OTP" }
    }

    return { success: true, message: "Email verified successfully! You can now login." }
  } catch (error) {
    console.error("Email verification error:", error)
    return { success: false, message: "An error occurred during verification" }
  }
}

// Login user
export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    // Find the user - using direct select instead of query builder
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const user = userResults.length > 0 ? userResults[0] : null

    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        message: "Email not verified. Please verify your email first.",
        needsVerification: true,
        email,
      }
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password)

    if (!passwordValid) {
      return { success: false, message: "Invalid email or password" }
    }

    // Send 2FA login OTP
    const otpSent = await createAndSendOTP(email, "loginVerification")

    if (!otpSent) {
      return { success: false, message: "Failed to send login verification code" }
    }

    return {
      success: true,
      message: "Please check your email for the login verification code.",
      email,
      requiresOTP: true,
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An error occurred during login" }
  }
}

// Verify login OTP and complete login
export async function verifyLoginOTP(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    const verified = await verifyOTP(email, otp, "loginVerification")

    if (!verified) {
      return { success: false, message: "Invalid or expired OTP" }
    }

    // Find the user - using direct select instead of query builder
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const user = userResults.length > 0 ? userResults[0] : null

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Create and set JWT token
    const token = await createToken(user.id, user.email)
    setTokenCookie(token)

    // Instead of redirecting here, return success with redirect path
    revalidatePath("/profile")
    return {
      success: true,
      message: "Login successful!",
      redirectTo: "/profile",
    }
  } catch (error) {
    console.error("Login verification error:", error)
    return { success: false, message: "An error occurred during login verification" }
  }
}

// Request password reset
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    // Check if user exists - using direct select instead of query builder
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const user = userResults.length > 0 ? userResults[0] : null

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return {
        success: true,
        message: "If your email is registered, you will receive a password reset code.",
      }
    }

    // Send password reset OTP
    const otpSent = await createAndSendOTP(email, "passwordReset")

    return {
      success: true,
      message: "If your email is registered, you will receive a password reset code.",
      email: otpSent ? email : undefined,
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return { success: false, message: "An error occurred while processing your request" }
  }
}

// Verify password reset OTP
export async function verifyPasswordResetOTP(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    const verified = await verifyOTP(email, otp, "passwordReset")

    if (!verified) {
      return { success: false, message: "Invalid or expired OTP" }
    }

    return {
      success: true,
      message: "OTP verified. You can now reset your password.",
      email,
    }
  } catch (error) {
    console.error("Password reset verification error:", error)
    return { success: false, message: "An error occurred during verification" }
  }
}

// Reset password
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Update the user's password
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email))

    return {
      success: true,
      message: "Password reset successful! You can now login with your new password.",
      redirectTo: "/login",
    }
  } catch (error) {
    console.error("Password reset error:", error)
    return { success: false, message: "An error occurred while resetting your password" }
  }
}

// Update user profile
export async function updateProfile(formData: FormData) {
  const userId = Number.parseInt(formData.get("userId") as string)
  const name = formData.get("name") as string

  try {
    // Ensure database is initialized
    await ensureDbInitialized()

    await db.update(users).set({ name }).where(eq(users.id, userId))

    revalidatePath("/profile")
    return { success: true, message: "Profile updated successfully!" }
  } catch (error) {
    console.error("Profile update error:", error)
    return { success: false, message: "An error occurred while updating your profile" }
  }
}

// Logout
export async function logout() {
  logoutUser()
  // Return a redirect path instead of directly redirecting
  return { success: true, redirectTo: "/login" }
}
