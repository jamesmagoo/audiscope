import { auth } from "@/app/api/auth/[...nextauth]/route"
import { AuthenticationError } from "./auth-error"
import { getClientHeaders } from "./api-utils"

/**
 * Get authentication headers for server-side API requests
 * Use this in Server Components, Server Actions, and API Routes
 */
export async function getServerAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await auth()
    const token = session?.accessToken

    if (!token) {
      throw new AuthenticationError("No access token available")
    }

    return {
      Authorization: `Bearer ${token}`,
      ...getClientHeaders(),
    }
  } catch (error) {
    console.error("Failed to get server auth headers:", error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError("Failed to get authentication headers", undefined, error as Error)
  }
}

/**
 * Get current user ID from server-side session
 * Use this in Server Components, Server Actions, and API Routes
 */
export async function getServerUserId(): Promise<string> {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      throw new AuthenticationError("No user ID available in session")
    }

    return userId
  } catch (error) {
    console.error("Failed to get server user ID:", error)
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError("Failed to get user ID from session", undefined, error as Error)
  }
}

/**
 * Get current user session from server-side
 * Use this in Server Components, Server Actions, and API Routes
 * Returns null if no session exists (user not authenticated)
 */
export async function getServerSession() {
  return await auth()
}

/**
 * Require authentication in server components/actions
 * Throws AuthenticationError if user is not authenticated
 */
export async function requireServerAuth() {
  const session = await auth()

  if (!session?.user) {
    throw new AuthenticationError("Authentication required")
  }

  return session
}
