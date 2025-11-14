import { fetchAuthSession } from "aws-amplify/auth"
import { logJWTClaims } from "./jwt-debug"

export interface ApiError extends Error {
  status?: number
  statusText?: string
}


export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()

    if (!token) {
      throw new Error("No access token available")
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  } catch (error) {
    console.error("Failed to get auth headers:", error)
    throw error
  }
}

export async function getCurrentUserId(): Promise<string> {
  try {
    const session = await fetchAuthSession()
    const userId = session.tokens?.accessToken?.payload?.sub as string

    if (!userId) {
      throw new Error("No user ID available in token")
    }

    return userId
  } catch (error) {
    console.error("Failed to get user ID:", error)
    throw error
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
        throw new Error('No access token available')
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      return response
    } catch (error) {
      console.error('Request failed:', error)
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
      
      return await makeRequest(true)
    }
    
    return response
  } catch (error) {
    const apiError = error as ApiError
    
    // If it's an auth error, we might want to redirect to login
    if (apiError.message?.includes('token') || apiError.message?.includes('auth')) {
      console.error('Authentication failed, user may need to log in again')
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
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // If we can't parse JSON, use the response text
      try {
        const errorText = await response.text()
        errorMessage = errorText.substring(0, 100) || errorMessage
      } catch {
        // Use the default error message
      }
    }
    
    const error = new Error(errorMessage) as ApiError
    error.status = response.status
    error.statusText = response.statusText
    throw error
  }
  
  return response.json()
}