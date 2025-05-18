import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { initDatabase } from "@/lib/db"

// Initialize database when the app starts
initDatabase().catch((error) => {
  console.error("Failed to initialize database:", error)
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "2FA Authentication System",
  description: "A complete authentication system with 2FA",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
