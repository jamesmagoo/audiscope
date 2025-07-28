"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser, 
  confirmSignUp, 
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  type SignUpInput,
  type SignInInput,
  type ConfirmSignUpInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput
} from 'aws-amplify/auth'
import { configureAmplify } from '@/lib/auth-config'

interface User {
  username: string
  email: string
  attributes: Record<string, any>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInUser: (username: string, password: string) => Promise<void>
  signUpUser: (username: string, password: string, email: string) => Promise<void>
  signOutUser: () => Promise<void>
  confirmSignUpUser: (username: string, code: string) => Promise<void>
  resendConfirmationCode: (username: string) => Promise<void>
  forgotPassword: (username: string) => Promise<void>
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    configureAmplify()
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      setUser({
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || '',
        attributes: {
          userId: currentUser.userId,
          email: currentUser.signInDetails?.loginId || '',
          username: currentUser.username
        }
      })
      console.log(currentUser)
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
      const result = await signIn({
        username,
        password
      })
      
      if (result.isSignedIn) {
        const currentUser = await getCurrentUser()
        setUser({
          username: currentUser.username,
          email: currentUser.signInDetails?.loginId || username,
          attributes: {
            userId: currentUser.userId,
            email: currentUser.signInDetails?.loginId || username,
            username: currentUser.username
          }
        })
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
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
        options: {
          userAttributes: {
            email,
          }
        }
      })
    } catch (error: any) {
      setError(error.message || 'Failed to sign up')
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
      setError(error.message || 'Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const confirmSignUpUser = async (username: string, code: string) => {
    try {
      setLoading(true)
      setError(null)
      await confirmSignUp({
        username,
        confirmationCode: code
      })
    } catch (error: any) {
      setError(error.message || 'Failed to confirm sign up')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resendConfirmationCode = async (username: string) => {
    try {
      setLoading(true)
      setError(null)
      await resendSignUpCode({
        username
      })
    } catch (error: any) {
      setError(error.message || 'Failed to resend confirmation code')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (username: string) => {
    try {
      setLoading(true)
      setError(null)
      await resetPassword({
        username
      })
    } catch (error: any) {
      setError(error.message || 'Failed to initiate password reset')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const confirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    try {
      setLoading(true)
      setError(null)
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword
      })
    } catch (error: any) {
      setError(error.message || 'Failed to reset password')
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}