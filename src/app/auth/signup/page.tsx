'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FaGithub, FaCheck, FaTimes, FaDiscord } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Password validation
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/auth/verify-email')
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: 'github' | 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    }
  }

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2">
      {met ? (
        <FaCheck className="h-4 w-4 text-green-500" />
      ) : (
        <FaTimes className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm ${met ? 'text-green-500' : 'text-red-500'}`}>{text}</span>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSocialSignUp('google')}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
            >
              <FcGoogle className="h-5 w-5" />
              <span className="sr-only sm:not-sr-only">Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialSignUp('github')}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#24292F] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#24292F]/90 focus:outline-offset-0"
            >
              <FaGithub className="h-5 w-5" />
              <span className="sr-only sm:not-sr-only">GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialSignUp('discord')}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#5865F2] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5865F2]/90 focus:outline-offset-0"
            >
              <FaDiscord className="h-5 w-5" />
              <span className="sr-only sm:not-sr-only">Discord</span>
            </button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Password requirements:</h4>
                <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
                <PasswordRequirement met={hasUpperCase} text="At least one uppercase letter" />
                <PasswordRequirement met={hasLowerCase} text="At least one lowercase letter" />
                <PasswordRequirement met={hasNumber} text="At least one number" />
                <PasswordRequirement met={hasSpecialChar} text="At least one special character" />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                disabled={isLoading || !isPasswordValid}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 