import { requireAuth } from "@/lib/auth"
import Navbar from "@/components/navbar"
import ProfileForm from "./profile-form"

export default async function ProfilePage() {
  // This will redirect to login if not authenticated
  const user = await requireAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={true} />

      <main className="flex-grow py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
                  <p>{user.emailVerified ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
              <ProfileForm user={user} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
