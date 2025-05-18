import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"
import LoginForm from "./login-form"

export default async function LoginPage() {
  // If user is already logged in, redirect to profile
  const user = await getCurrentUser()
  if (user) {
    redirect("/profile")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={false} />

      <main className="flex-grow flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
          <LoginForm />
        </div>
      </main>
    </div>
  )
}
