"use client"

import React, { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

// Component to handle search params (needs Suspense)
function LoginForm() {
  const [successMessage, setSuccessMessage] = React.useState('')
  const [error, setError] = React.useState('')
  const [isSigningIn, setIsSigningIn] = React.useState(false)
  const { user, loading, signInUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
    }

    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError('Authentication failed. Please try again.')
      setIsSigningIn(false) // Reset on error
    }
  }, [searchParams])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSignIn = async () => {
    if (isSigningIn) return // Prevent double-clicks

    setIsSigningIn(true)
    setError('')

    try {
      // Use AuthProvider's signInUser method
      await signInUser()
    } catch (error: any) {
      setError('Failed to initiate sign in')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="w-full max-w-md p-6">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-3xl font-bold text-foreground">Landy</span>
          </div>
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to your Landy account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in to your Landy account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSignIn}
            className="w-full"
            disabled={loading || isSigningIn}
            size="lg"
          >
            {(loading || isSigningIn) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to sign in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={
        <div className="w-full max-w-md p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
