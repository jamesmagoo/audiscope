"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  useEffect(() => {
    // Automatically redirect to Keycloak password reset page
    resetPassword()
  }, [resetPassword])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center space-x-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <span className="text-2xl font-bold text-primary-foreground">A</span>
              </div>
              <span className="text-3xl font-bold text-foreground">AudiScope</span>
            </div>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Redirecting to password reset page...
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>
              You will be redirected to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If you are not redirected automatically, click the button below
              </p>
              <Button
                onClick={resetPassword}
                className="w-full"
                size="lg"
              >
                Reset Password
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
