import { fetchAuthSession } from "aws-amplify/auth"
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
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()

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
    const session = await fetchAuthSession()
    const userId = session.tokens?.accessToken?.payload?.sub as string

    if (!userId) {
      throw new AuthenticationError("No user ID available in token")
    }

    return userId
  } catch (error) {
    console.error("Failed to get user ID:", error)
    // Re-throw as AuthenticationError if it's not already one
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError("Failed to get user ID from token", undefined, error as Error)
  }
}

/**
 * Debug function to inspect JWT token and custom attributes
 * Call this from browser console: window.debugJWT()
 */
export async function debugJWT(): Promise<void> {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()

    if (!token) {
      console.error('❌ No access token found')
      return
    }

    console.log('🎫 Access Token (raw):', token)
    console.log('---')

    // Decode and log claims
    logJWTClaims(token)

    console.log('---')
    console.log('📦 Full Token Payload:', session.tokens?.accessToken?.payload)

    // Check for custom attributes
    const payload = session.tokens?.accessToken?.payload as any
    console.log('---')
    console.log('🔍 Checking for custom attributes:')
    console.log('  organisation_id:', payload?.organisation_id || payload?.['custom:organisation_id'] || '❌ NOT FOUND')
    console.log('  role:', payload?.role || payload?.['custom:role'] || '❌ NOT FOUND')

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
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const makeRequest = async (forceRefresh: boolean = false): Promise<Response> => {
    try {
      // Get fresh token if forceRefresh is true
      const session = await fetchAuthSession(forceRefresh ? { forceRefresh: true } : undefined)
      const token = session.tokens?.accessToken?.toString()

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

      return response
    } catch (error) {
      console.error('Request failed:', error)
      // Re-throw AuthenticationError as-is
      if (error instanceof AuthenticationError) {
        throw error
      }
      throw error
    }
  }

  try {
    // First attempt with current token
    const response = await makeRequest()

    // If we get 401/403, try refreshing the token once
    const headers = options.headers as Record<string, string> || {}
    if ((response.status === 401 || response.status === 403) && !headers['X-Retry-Count']) {
      console.log('Auth error, attempting token refresh...')

      const retryOptions = {
        ...options,
        headers: {
          ...options.headers,
          'X-Retry-Count': '1'
        }
      }

      // Try refreshing the token
      const retryResponse = await makeRequest(true)

      // If we still get 401/403 after token refresh, the session is truly invalid
      if (retryResponse.status === 401 || retryResponse.status === 403) {
        console.error('Authentication failed after token refresh - session expired')
        throw new AuthenticationError(
          'Session expired. Please sign in again.',
          retryResponse.status
        )
      }

      return retryResponse
    }

    // If we got 401/403 on first try and already retried, throw auth error
    if ((response.status === 401 || response.status === 403) && headers['X-Retry-Count']) {
      throw new AuthenticationError(
        'Session expired. Please sign in again.',
        response.status
      )
    }

    return response
  } catch (error) {
    // Re-throw AuthenticationError as-is
    if (error instanceof AuthenticationError) {
      console.error('Authentication failed, user needs to log in again')
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