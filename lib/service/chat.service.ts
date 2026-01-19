import { makeAuthenticatedRequest, handleApiResponse, getCurrentUserId } from '../api-utils'

// Use Next.js proxy path - all requests go through /api/core which rewrites to backend
const API_PATH = '/api/core/v1/chat'
const ENDPOINT = API_PATH

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
  const userId = await getCurrentUserId()
  const organisationId = "a5c70880-0aae-4e44-9a6e-a38c0e9383e8" // TODO: Get from user context

  const requestBody = {
    user_id: userId,
    organisation_id: organisationId,
    product_id: productId,
    session_type: sessionType,
    title: title || `${sessionType.toUpperCase()} Session - ${new Date().toLocaleDateString()}`
  }

  const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions`, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  const data = await handleApiResponse(response)

  return data
}

/**
 * Send a message in a chat session
 */
export async function sendMessage(
  sessionId: string,
  content: string
): Promise<SendMessageResult> {
  const userId = await getCurrentUserId()
  const organisationId = "a5c70880-0aae-4e44-9a6e-a38c0e9383e8" // TODO: Get from user context

  const requestBody = {
    content,
    user_id: userId,
    organisation_id: organisationId
  }

  const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  const data = await handleApiResponse(response)

  return data
}

/**
 * List all chat sessions (optionally filter by product_id)
 */
export async function listSessions(productId?: string, limit = 50, offset = 0): Promise<ListSessionsResult> {
  const params = new URLSearchParams()
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  // Filter by product_id on the backend
  if (productId) {
    params.append('product_id', productId)
  }

  const url = `${ENDPOINT}/sessions?${params.toString()}`

  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)

  return data
}

/**
 * Get a specific chat session with full message history
 */
export async function getSession(sessionId: string): Promise<GetSessionResult> {
  const organisationId = "a5c70880-0aae-4e44-9a6e-a38c0e9383e8" // TODO: Get from user context

  const params = new URLSearchParams()
  params.append('organisation_id', organisationId)

  const url = `${ENDPOINT}/sessions/${sessionId}?${params.toString()}`

  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)

  return data
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions/${sessionId}`, {
    method: 'DELETE'
  })

  // 204 No Content doesn't have a response body
  if (response.status !== 204) {
    await handleApiResponse(response)
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
