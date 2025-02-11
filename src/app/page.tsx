import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Welcome to IUT Schedule
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Access your class schedule easily and stay organized throughout the semester.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button asChild size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.email}</h1>
        <p className="mt-2 text-gray-600">Here's your schedule overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>View and manage your schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/schedule">View Schedule</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent schedule views</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Useful resources</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <Button variant="outline" asChild>
              <Link href="https://www.univ-fcomte.fr" target="_blank">
                University Website
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://ent.univ-fcomte.fr" target="_blank">
                ENT Portal
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
