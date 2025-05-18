import nodemailer from "nodemailer"

// Email templates
export const emailTemplates = {
  verification: (otp: string) => ({
    subject: "Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
      </div>
    `,
  }),
  passwordReset: (otp: string) => ({
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>We received a request to reset your password. Please use the following OTP to proceed:</p>
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  }),
  loginVerification: (otp: string) => ({
    subject: "Login Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Login Verification</h2>
        <p>Please use the following OTP to complete your login:</p>
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't attempt to log in, please secure your account immediately.</p>
      </div>
    `,
  }),
}

// Check if we're in a preview environment
const isPreviewEnvironment = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

// Store OTPs in memory for preview environment
const otpStore: Record<string, string> = {}

// Function to send an email
export async function sendEmail(
  to: string,
  template: "verification" | "passwordReset" | "loginVerification",
  otp: string,
) {
  const { subject, html } = emailTemplates[template](otp)

  // In preview environment, store OTP in memory and log it
  if (isPreviewEnvironment) {
    console.log(`
    ========== PREVIEW MODE: EMAIL NOT ACTUALLY SENT ==========
    To: ${to}
    Subject: ${subject}
    OTP: ${otp}
    Template: ${template}
    ==========================================================
    `)

    // Store the OTP for this email address
    otpStore[to] = otp

    return { success: true, messageId: "preview-mode" }
  }

  // In production, use Nodemailer
  try {
    // Create a transporter with Gmail credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: `"Auth System" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log(`Email sent: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}

// Function to get stored OTP (for preview environment only)
export function getStoredOTP(email: string): string | null {
  return otpStore[email] || null
}
