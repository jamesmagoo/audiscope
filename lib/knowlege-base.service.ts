import { makeAuthenticatedRequest, handleApiResponse, getCurrentUserId } from './api-utils'

// Use localhost API in development, AWS in production
const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:5002/api' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
const API_PATH = '/v1/knowledge-base';
const ENDPOINT = API_BASE + API_PATH

console.log('Knowledge Base Service Config:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE,
  API_PATH,
  ENDPOINT,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
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
    
    const url = new URL(`${ENDPOINT}/aws/chats`)
    url.searchParams.append("user_id", userId)
    url.searchParams.append("tenant_id", tenantId)
    url.searchParams.append("limit", limit.toString())
    url.searchParams.append("offset", offset.toString())

    console.log('getChats: Making GET request to:', url.toString())
    console.log('getChats: User ID:', userId)

    const response = await makeAuthenticatedRequest(url.toString())
    
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
    
    const url = new URL(`${ENDPOINT}/aws/chats/${chatId}`)
    url.searchParams.append("tenant_id", tenantId)

    const response = await makeAuthenticatedRequest(url.toString())
    return await handleApiResponse(response)
  } catch (error) {
    console.error('Error getting chat:', error)
    throw error
  }
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const tenantId = "default"
    
    const url = new URL(`${ENDPOINT}/aws/chats/messages/${chatId}`)
    url.searchParams.append("tenant_id", tenantId)

    console.log('getChatMessages: Making GET request to:', url.toString())
    console.log('getChatMessages: Chat ID:', chatId)

    const response = await makeAuthenticatedRequest(url.toString())
    
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