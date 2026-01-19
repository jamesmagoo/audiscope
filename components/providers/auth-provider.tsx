"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react"
import * as Sentry from "@sentry/nextjs"

interface User {
  username: string
  email: string
  attributes: Record<string, any>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInUser: () => Promise<void>
  signOutUser: () => Promise<void>
  registerUser: () => void
  resetPassword: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const AuthProviderInner = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const loading = status === "loading"

  // Transform NextAuth session into our User format
  // IMPORTANT: If session has an error or no user, treat as unauthenticated
  const user: User | null = session?.user && !session?.error
    ? {
        username: session.user.name || session.user.email?.split("@")[0] || "user",
        email: session.user.email || "",
        attributes: {
          userId: session.user.id,
          email: session.user.email || "",
          username: session.user.name || session.user.email?.split("@")[0] || "user",
          organisationId: session.user.organisationId,
          roles: session.user.roles,
        },
      }
    : null

  // Set Sentry user context
  if (user) {
    Sentry.setUser({
      id: user.attributes.userId,
      email: user.email,
      username: user.username,
    })
  } else {
    Sentry.setUser(null)
  }

  const signInUser = async () => {
    // Trigger NextAuth Keycloak OAuth2 flow
    // This will redirect to Keycloak login, then back to the app
    await signIn("keycloak", {
      callbackUrl: "/dashboard",
      redirect: true,
    })
  }

  const signOutUser = async () => {
    try {
      await signOut({ redirect: false })
      Sentry.setUser(null)
    } catch (error: any) {
      throw error
    }
  }

  const registerUser = () => {
    // Redirect to Keycloak registration page
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080"
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "audiscope"
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "audiscope-web"
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`)

    window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/registrations?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${redirectUri}`
  }

  const resetPassword = () => {
    // Redirect to Keycloak password reset page
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080"
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "audiscope"
    window.location.href = `${keycloakUrl}/realms/${realm}/login-actions/reset-credentials`
  }

  const value = {
    user,
    loading,
    error: session?.error || null,
    signInUser,
    signOutUser,
    registerUser,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider
      refetchInterval={0} // Disable automatic refetching to prevent memory leaks
      refetchOnWindowFocus={false} // Disable refetch on tab focus
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}
