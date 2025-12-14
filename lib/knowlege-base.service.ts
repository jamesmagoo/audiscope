import { makeAuthenticatedRequest, handleApiResponse, getCurrentUserId } from './api-utils'

// Use Next.js proxy path - all requests go through /api/core which rewrites to backend
const API_PATH = '/api/core/v1/knowledge-base'
const ENDPOINT = API_PATH

console.log('Knowledge Base Service Config:', {
  NODE_ENV: process.env.NODE_ENV,
  API_PATH,
  ENDPOINT,
  USING_PROXY: true
})

interface ChatMessage {
  id?: string
  chat_id?: string
  content: string
  role: "user" | "assistant"
  timestamp?: string
  metadata?: Record<string, any>
  tenant_id?: string
}

interface Chat {
  id: string
  title: string
  user_id: string
  tenant_id: string
  knowledge_base_id?: string
  aws_session_id?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

interface ChatResponse {
  chat: Chat
  messages: ChatMessage[]
  sources?: Source[]
  metadata?: Record<string, any>
}

interface Source {
  title: string
  uri: string
  content: string
  metadata?: Record<string, any>
}

interface ChatQueryRequest {
  messages: Omit<ChatMessage, 'id' | 'chat_id' | 'timestamp' | 'tenant_id'>[]
  chat_id?: string
  user_id: string
  tenant_id: string
  knowledge_base_id?: string
  metadata?: Record<string, any>
}

// Chat/Conversation APIs
export async function sendMessage(content: string, chatId?: string, knowledgeBaseId?: string): Promise<ChatResponse> {
  try {
    const userId = await getCurrentUserId()
    const tenantId = "default" // You may want to get this from JWT or config
    
    const request: ChatQueryRequest = {
      messages: [{
        content,
        role: "user"
      }],
      chat_id: chatId,
      user_id: userId,
      tenant_id: tenantId,
      knowledge_base_id: knowledgeBaseId
    }

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/aws/chat`, {
      method: 'POST',
      body: JSON.stringify(request)
    })

    return await handleApiResponse(response)
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export async function getChats(limit = 20, offset = 0): Promise<Chat[]> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const userId = await getCurrentUserId()
    const tenantId = "default"

    const params = new URLSearchParams()
    params.append("user_id", userId)
    params.append("tenant_id", tenantId)
    params.append("limit", limit.toString())
    params.append("offset", offset.toString())

    const url = `${ENDPOINT}/aws/chats?${params.toString()}`
    console.log('getChats: Making GET request to:', url)
    console.log('getChats: User ID:', userId)

    const response = await makeAuthenticatedRequest(url)

    console.log('getChats: Response status:', response.status)

    const data = await handleApiResponse(response)
    console.log('getChats: Response data:', data)

    return data
  } catch (error) {
    console.error('Error getting chats:', error)
    throw error
  }
}

export async function getChatById(chatId: string): Promise<Chat> {
  try {
    const tenantId = "default"

    const params = new URLSearchParams()
    params.append("tenant_id", tenantId)

    const url = `${ENDPOINT}/aws/chats/${chatId}?${params.toString()}`
    const response = await makeAuthenticatedRequest(url)
    return await handleApiResponse(response)
  } catch (error) {
    console.error('Error getting chat:', error)
    throw error
  }
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const tenantId = "default"

    const params = new URLSearchParams()
    params.append("tenant_id", tenantId)

    const url = `${ENDPOINT}/aws/chats/messages/${chatId}?${params.toString()}`
    console.log('getChatMessages: Making GET request to:', url)
    console.log('getChatMessages: Chat ID:', chatId)

    const response = await makeAuthenticatedRequest(url)

    console.log('getChatMessages: Response status:', response.status)

    const data = await handleApiResponse(response)
    console.log('getChatMessages: Response data:', data)

    return data
  } catch (error) {
    console.error('Error getting chat messages:', error)
    throw error
  }
}

// Document Upload API (Updated to use multipart/form-data)
export async function uploadDocumentAWS(file: File, knowledgeBaseId: string): Promise<any> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('knowledge_base_id', knowledgeBaseId)

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/aws/upload`, {
      method: 'POST',
      body: formData
      // Don't set Content-Type header - browser will set it with boundary for multipart
    })

    return await handleApiResponse(response)
  } catch (error) {
    console.error('Error uploading document:', error)
    throw error
  }
}

// Helper function to extract conversation title from first user message
export function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === "user")
  if (!firstUserMessage) return "New Conversation"
  
  const content = firstUserMessage.content.trim()
  if (content.length <= 50) return content
  
  return content.substring(0, 47) + "..."
}

// TODO:
//  delete chat
//  update chat title
//  list documents
//  delete documents

// Main client export
const kbClient = {
  // Chat APIs
  sendMessage,
  getChats,
  getChatById,
  getChatMessages,
  
  // Document APIs
  uploadDocumentAWS,
  
  // Utilities
  generateChatTitle
}

export default kbClient

// Export types for use in components
export type {
  ChatMessage,
  Chat,
  ChatResponse,
  Source,
  ChatQueryRequest
}