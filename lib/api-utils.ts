import { fetchAuthSession } from "aws-amplify/auth"

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
