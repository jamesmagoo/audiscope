import { makeAuthenticatedRequest, handleApiResponse, getCurrentUserId } from '../api-utils'

// Use Next.js proxy path - all requests go through /api/core which rewrites to backend
const API_PATH = '/api/core/v1/chat'
const ENDPOINT = API_PATH

console.log('Product Chat Service Config:', {
  NODE_ENV: process.env.NODE_ENV,
  API_PATH,
  ENDPOINT,
  USING_PROXY: true
})

/**
 * TypeScript Interfaces
 */

export interface ChatSession {
  session_id: string
  user_id: string
  organisation_id: string
  product_id?: string
  session_type: 'qa' | 'practice' | 'concept'
  title: string
  started_at: string
  ended_at?: string
  last_message_at?: string
  message_count?: number
}

export interface ChatMessage {
  id: string
  session_id?: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
  model?: string
  token_count?: number
}

export interface SendMessageResult {
  user_message: ChatMessage
  assistant_message: ChatMessage
  tokens_used: number
  model: string
}

export interface StartSessionResult {
  session_id: string
  user_id: string
  organisation_id: string
  product_id?: string
  session_type: string
  title: string
  started_at: string
}

export interface GetSessionResult {
  session_id: string
  user_id: string
  organisation_id: string
  product_id?: string
  session_type: string
  title: string
  started_at: string
  ended_at?: string
  last_message_at?: string
  message_count: number
  messages: ChatMessage[]
}

export interface ListSessionsResult {
  sessions: ChatSession[]
  total_count: number
  limit: number
  offset: number
}

/**
 * API Functions
 */

/**
 * Start a new chat session for a product
 */
export async function startChatSession(
  productId: string,
  sessionType: 'qa' | 'practice' | 'concept',
  title?: string
): Promise<StartSessionResult> {
  try {
    const userId = await getCurrentUserId()
    const organisationId = "a5c70880-0aae-4e44-9a6e-a38c0e9383e8" // TODO: Get from user context

    const requestBody = {
      user_id: userId,
      organisation_id: organisationId,
      product_id: productId,
      session_type: sessionType,
      title: title || `${sessionType.toUpperCase()} Session - ${new Date().toLocaleDateString()}`
    }

    console.log('startChatSession: Request:', requestBody)

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const data = await handleApiResponse(response)
    console.log('startChatSession: Response:', data)

    return data
  } catch (error) {
    console.error('Error starting chat session:', error)
    throw error
  }
}

/**
 * Send a message in a chat session
 */
export async function sendMessage(
  sessionId: string,
  content: string
): Promise<SendMessageResult> {
  try {
    const userId = await getCurrentUserId()
    const organisationId = "a5c70880-0aae-4e44-9a6e-a38c0e9383e8" // TODO: Get from user context

    const requestBody = {
      content,
      user_id: userId,
      organisation_id: organisationId
    }

    console.log('sendMessage: Session:', sessionId, 'Request:', requestBody)

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const data = await handleApiResponse(response)
    console.log('sendMessage: Response:', data)

    return data
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

/**
 * List all chat sessions (optionally filter by product_id)
 */
export async function listSessions(productId?: string, limit = 50, offset = 0): Promise<ListSessionsResult> {
  try {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())

    // Filter by product_id on the backend
    if (productId) {
      params.append('product_id', productId)
    }

    const url = `${ENDPOINT}/sessions?${params.toString()}`
    console.log('listSessions: Making GET request to:', url)

    const response = await makeAuthenticatedRequest(url)
    const data = await handleApiResponse(response)

    console.log('listSessions: Response:', data)

    return data
  } catch (error) {
    console.error('Error listing sessions:', error)
    throw error
  }
}

/**
 * Get a specific chat session with full message history
 */
export async function getSession(sessionId: string): Promise<GetSessionResult> {
  try {
    const organisationId = "a5c70880-0aae-4e44-9a6e-a38c0e9383e8" // TODO: Get from user context

    const params = new URLSearchParams()
    params.append('organisation_id', organisationId)

    const url = `${ENDPOINT}/sessions/${sessionId}?${params.toString()}`
    console.log('getSession: Making GET request to:', url)

    const response = await makeAuthenticatedRequest(url)
    const data = await handleApiResponse(response)

    console.log('getSession: Response:', data)

    return data
  } catch (error) {
    console.error('Error getting session:', error)
    throw error
  }
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    console.log('deleteSession: Deleting session:', sessionId)

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions/${sessionId}`, {
      method: 'DELETE'
    })

    // 204 No Content doesn't have a response body
    if (response.status !== 204) {
      await handleApiResponse(response)
    }

    console.log('deleteSession: Session deleted successfully')
  } catch (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}

/**
 * Client export
 */
export const productChatClient = {
  startChatSession,
  sendMessage,
  listSessions,
  getSession,
  deleteSession
}

export default productChatClient
