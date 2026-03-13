import { useState, useCallback } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text?: string
  audioUrl?: string
  duration?: number
  timestamp: Date
  turnNumber?: number
}

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    )
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const getLatestAiMessage = useCallback(() => {
    return messages.filter((msg) => msg.role === 'ai').pop()
  }, [messages])

  return {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    getLatestAiMessage,
  }
}
