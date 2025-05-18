import { getCurrentUser } from "@/lib/auth"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={!!user} />

      <main className="flex-grow flex items-center justify-center bg-background">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            <span className="block">2FA Authentication</span>
            <span className="block text-primary">System</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A complete authentication system with two-factor authentication, email verification, and password reset
            functionality.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {user ? (
              <Link href="/profile">
                <Button size="lg" className="w-full sm:w-auto">
                  Go to Profile
                </Button>
              </Link>
            ) : (
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                <Link href="/login">
                  <Button size="lg" variant="default" className="w-full sm:w-auto">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
