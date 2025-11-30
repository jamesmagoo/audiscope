"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'

// Component to handle search params (needs Suspense)
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [step, setStep] = useState<'login' | 'newPassword'>('login')
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    newPassword?: string;
    confirmNewPassword?: string;
    general?: string
  }>({})
  const [successMessage, setSuccessMessage] = useState('')
  const auth = useAuth()
  const { signInUser, completeNewPassword, signOutUser, isOperationLoading, user } = auth
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !auth.loading) {
      router.push('/dashboard/products')
    }
  }, [user, auth.loading, router])

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateNewPasswordForm = () => {
    const newErrors: { newPassword?: string; confirmNewPassword?: string } = {}

    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your password'
    } else if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // If there's already a user signed in, sign them out first
      if (user) {
        await signOutUser()
      }

      const result = await signInUser(email, password)

      // Check if user needs to complete new password challenge
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setStep('newPassword')
        setErrors({})
      } else if (result.isSignedIn) {
        router.push('/dashboard/products')
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to sign in' })
    }
  }

  const handleCompleteNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateNewPasswordForm()) {
      return
    }

    try {
      await completeNewPassword(newPassword)
      router.push('/dashboard/products')
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to set new password' })
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
            <span className="text-3xl font-bold text-foreground">AudiScope</span>
          </div>
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          {step === 'login' ? 'Welcome back' : 'Set new password'}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {step === 'login'
            ? 'Sign in to your AudiScope account'
            : 'Please set a new password for your account'
          }
        </p>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'login' ? 'Sign In' : 'New Password Required'}
            </CardTitle>
            <CardDescription>
              {step === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Create a strong password that meets the requirements below'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              
              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isOperationLoading}
              >
                {isOperationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            ) : (
              <form onSubmit={handleCompleteNewPassword} className="space-y-6">
                {errors.general && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}

                <Alert variant="default" className="border-blue-200 bg-blue-50 text-blue-800">
                  <AlertDescription>
                    You are signing in for the first time with a temporary password. Please create a new password to continue.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={errors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={errors.confirmNewPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="text-sm text-red-500">{errors.confirmNewPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isOperationLoading}
                >
                  {isOperationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </Button>
              </form>
            )}

            {/*<div className="mt-6 text-center">*/}
            {/*  <p className="text-sm text-gray-600 dark:text-gray-400">*/}
            {/*    Don't have an account?{' '}*/}
            {/*    <Link*/}
            {/*      href="/signup"*/}
            {/*      className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"*/}
            {/*    >*/}
            {/*      Sign up*/}
            {/*    </Link>*/}
            {/*  </p>*/}
            {/*</div>*/}
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
