"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  confirmSignIn,
  type SignInOutput,
} from "aws-amplify/auth"
import { Amplify } from "aws-amplify"

const authConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
    },
  },
}

interface User {
  username: string
  email: string
  attributes: Record<string, any>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInUser: (username: string, password: string) => Promise<SignInOutput>
  signUpUser: (username: string, password: string, email: string) => Promise<void>
  signOutUser: () => Promise<void>
  confirmSignUpUser: (username: string, code: string) => Promise<void>
  resendConfirmationCode: (username: string) => Promise<void>
  forgotPassword: (username: string) => Promise<void>
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>
  completeNewPassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Amplify.configure(authConfig, { ssr: true })
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      setUser({
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || "",
        attributes: {
          userId: currentUser.userId,
          email: currentUser.signInDetails?.loginId || "",
          username: currentUser.username,
        },
      })
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signInUser = async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await signIn({ username, password })
      if (result.isSignedIn) {
        await checkAuthState()
      }
      return result
    } catch (error: any) {
      setError(error.message || "Failed to sign in")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUpUser = async (username: string, password: string, email: string) => {
    try {
      setLoading(true)
      setError(null)
      await signUp({
        username,
        password,
        options: { userAttributes: { email } },
      })
    } catch (error: any) {
      setError(error.message || "Failed to sign up")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async () => {
    try {
      setLoading(true)
      setError(null)
      await signOut()
      setUser(null)
    } catch (error: any) {
      setError(error.message || "Failed to sign out")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const confirmSignUpUser = async (username: string, code: string) => {
    try {
      setLoading(true)
      setError(null)
      await confirmSignUp({ username, confirmationCode: code })
    } catch (error: any) {
      setError(error.message || "Failed to confirm sign up")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resendConfirmationCode = async (username: string) => {
    try {
      setLoading(true)
      setError(null)
      await resendSignUpCode({ username })
    } catch (error: any) {
      setError(error.message || "Failed to resend confirmation code")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (username: string) => {
    try {
      setLoading(true)
      setError(null)
      await resetPassword({ username })
    } catch (error: any) {
      setError(error.message || "Failed to initiate password reset")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const confirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    try {
      setLoading(true)
      setError(null)
      await confirmResetPassword({ username, confirmationCode: code, newPassword })
    } catch (error: any) {
      setError(error.message || "Failed to reset password")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const completeNewPassword = async (newPassword: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await confirmSignIn({ challengeResponse: newPassword })
      if (result.isSignedIn) {
        await checkAuthState()
      }
    } catch (error: any) {
      setError(error.message || "Failed to set new password")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signInUser,
    signUpUser,
    signOutUser,
    confirmSignUpUser,
    resendConfirmationCode,
    forgotPassword,
    confirmForgotPassword,
    completeNewPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
