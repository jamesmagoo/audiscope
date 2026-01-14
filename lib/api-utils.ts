import { getSession } from "next-auth/react"
import { logJWTClaims } from "./jwt-debug"
import { AuthenticationError } from "./auth-error"

export interface ApiError extends Error {
  status?: number
  statusText?: string
}

/**
 * Get client identification headers for tracking which client is making requests
 * These headers help with debugging, monitoring, and platform-specific issue tracking
 */
export function getClientHeaders(): Record<string, string> {
  return {
    'X-Client-Platform': 'web',
    'X-Client-Version': '0.1.0', // Matches package.json version
    // Device ID is optional for web clients
    // Could use localStorage to generate a persistent client ID if needed
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await getSession()
    const token = session?.accessToken

    if (!token) {
      throw new AuthenticationError("No access token available")
    }

    return {
      Authorization: `Bearer ${token}`,
      ...getClientHeaders(), // Include client identification headers
    }
  } catch (error) {
    console.error("Failed to get auth headers:", error)
    // Re-throw as AuthenticationError if it's not already one
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError("Failed to get authentication headers", undefined, error as Error)
  }
}

export async function getCurrentUserId(): Promise<string> {
  try {
    const session = await getSession()
    const userId = session?.user?.id

    if (!userId) {
      throw new AuthenticationError("No user ID available in session")
    }

    return userId
  } catch (error) {
    console.error("Failed to get user ID:", error)
    // Re-throw as AuthenticationError if it's not already one
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError("Failed to get user ID from session", undefined, error as Error)
  }
}

/**
 * Debug function to inspect JWT token and custom attributes
 * Call this from browser console: window.debugJWT()
 */
export async function debugJWT(): Promise<void> {
  try {
    const session = await getSession()
    const token = session?.accessToken

    if (!token) {
      console.error('❌ No access token found')
      return
    }

    console.log('🎫 Access Token (raw):', token)
    console.log('---')

    // Decode and log claims
    logJWTClaims(token)

    console.log('---')
    console.log('📦 Full Session:', session)

    // Check for custom attributes
    console.log('---')
    console.log('🔍 Checking for custom attributes:')
    console.log('  user.id:', session.user?.id || '❌ NOT FOUND')
    console.log('  user.organisationId:', session.user?.organisationId || '❌ NOT FOUND')
    console.log('  user.roles:', session.user?.roles || '❌ NOT FOUND')

  } catch (error) {
    console.error('Error debugging JWT:', error)
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugJWT = debugJWT
}

/**
 * Make an authenticated API request with automatic token refresh on auth errors
 * Note: NextAuth handles token refresh automatically, so we don't need manual refresh logic
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const session = await getSession()
    const token = session?.accessToken

    if (!token) {
      throw new AuthenticationError('No access token available')
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...getClientHeaders(), // Include client identification headers
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // If we get 401/403, the session has expired
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication failed - session expired')
      throw new AuthenticationError(
        'Session expired. Please sign in again.',
        response.status
      )
    }

    return response
  } catch (error) {
    console.error('Request failed:', error)

    // Re-throw AuthenticationError as-is
    if (error instanceof AuthenticationError) {
      throw error
    }

    const apiError = error as ApiError

    // Check if it's an auth-related error even if not explicitly AuthenticationError
    if (apiError.message?.includes('token') || apiError.message?.includes('auth')) {
      console.error('Authentication failed, user may need to log in again')
      throw new AuthenticationError(
        'Authentication failed. Please sign in again.',
        apiError.status,
        error as Error
      )
    }

    throw error
  }
}

/**
 * Helper function to handle API response errors
 */
export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`
    let errorDetails = ''

    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
      errorDetails = errorData.details || ''

      // Log the full error for debugging
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error: errorMessage,
        details: errorDetails,
        fullResponse: errorData
      })
    } catch {
      // If we can't parse JSON, use the response text
      try {
        const errorText = await response.text()
        errorMessage = errorText.substring(0, 200) || errorMessage
        console.error('API Error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          text: errorText
        })
      } catch {
        // Use the default error message with better logging
        errorMessage = `HTTP ${response.status} ${response.statusText || 'Error'}`
        console.error('API Error (no body):', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          method: 'Unknown'
        })
      }
    }

    // Throw AuthenticationError for auth-related status codes
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError(
        errorMessage || 'Session expired. Please sign in again.',
        response.status
      )
    }

    const error = new Error(errorMessage) as ApiError
    error.status = response.status
    error.statusText = response.statusText
    throw error
  }

  return response.json()
}
