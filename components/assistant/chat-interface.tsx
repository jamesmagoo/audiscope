"use client"

import { useState, useEffect, useRef } from "react"
import { Message, MessageType } from "./message"
import { MessageInput } from "./message-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquareText, Plus, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ChatMessage, type Chat, type ChatResponse } from "@/lib/knowlege-base.service"
import { useChat, useChatMessages, useSendMessage, useKnowledgeBaseConfig } from "@/hooks/use-knowledge-base"
import { usePostHog } from 'posthog-js/react'
import { CHAT_EVENTS } from '@/lib/analytics/posthog-events'

interface ChatInterfaceProps {
  conversationId: string | null
  onConversationUpdate?: (conversation: Chat) => void
  onNewConversation?: () => void
}

// Helper function to convert API messages to UI message format
function convertApiMessagesToUI(apiMessages: ChatMessage[]): MessageType[] {
  return apiMessages.map(msg => ({
    id: msg.id || `msg-${Date.now()}-${Math.random()}`,
    content: msg.content,
    sender: msg.role,
    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
  }))
}

export function ChatInterface({ conversationId, onConversationUpdate, onNewConversation }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionStartTracked = useRef(false)
  const messageStartTime = useRef<number>(Date.now())

  // React Query hooks
  const { data: currentChat, isLoading: chatLoading } = useChat(conversationId)
  const { data: chatMessages, isLoading: messagesLoading } = useChatMessages(conversationId)
  const sendMessageMutation = useSendMessage()
  const { knowledgeBaseId } = useKnowledgeBaseConfig()
  const posthog = usePostHog()

  // Track chat session started (once per mount without conversationId)
  useEffect(() => {
    if (!conversationId && !sessionStartTracked.current) {
      posthog?.capture(CHAT_EVENTS.CHAT_SESSION_STARTED)
      sessionStartTracked.current = true
    }
  }, [conversationId, posthog])
  
  // Load messages when chat messages are fetched
  useEffect(() => {
    if (chatMessages) {
      setMessages(convertApiMessagesToUI(chatMessages))
    } else {
      setMessages([])
    }
  }, [chatMessages])

  // Update parent when chat changes
  useEffect(() => {
    if (currentChat && onConversationUpdate) {
      onConversationUpdate(currentChat)
    }
  }, [currentChat, onConversationUpdate])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return

    // Track message sent
    messageStartTime.current = Date.now()
    posthog?.capture(CHAT_EVENTS.MESSAGE_SENT, {
      conversationId: conversationId || 'new',
      messageLength: content.length,
      hasFiles: !!files && files.length > 0,
      fileCount: files?.length || 0,
    })

    // Add user message to UI immediately (optimistic update)
    const userMessage: MessageType = {
      id: `error-${Date.now()}`,
      content: content,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Send message using React Query mutation
      const response = await sendMessageMutation.mutateAsync({
        content,
        chatId: conversationId || undefined,
        knowledgeBaseId
      })

      // Track message received
      const responseTime = Math.round((Date.now() - messageStartTime.current) / 1000)
      posthog?.capture(CHAT_EVENTS.MESSAGE_RECEIVED, {
        conversationId: response.chat?.id || conversationId,
        responseTime,
        messageCount: response.messages?.length || 0,
      })

      // Track conversation created if this is a new conversation
      if (!conversationId && response.chat) {
        posthog?.capture(CHAT_EVENTS.CONVERSATION_CREATED, {
          conversationId: response.chat.id,
          chatTitle: response.chat.title,
        })
      }

      // Replace temp messages with real API response
      if (response.messages && response.messages.length > 0) {
        setMessages(convertApiMessagesToUI(response.messages))
      }

      // Notify parent of conversation update
      if (response.chat && onConversationUpdate) {
        onConversationUpdate(response.chat)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Replace optimistic message with error
      const errorMessage: MessageType = {
        id: `error-${Date.now()}`,
        content: "Sorry, I encountered an error processing your message. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev.slice(0, -1), errorMessage]) // Remove optimistic message
    }
  }

  const handleNewConversation = async () => {
    // Clear current messages to start fresh
    setMessages([])
    
    // Call parent's new conversation handler to reset the conversation ID
    if (onNewConversation) {
      onNewConversation()
    }
  }



  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 md:flex-initial">
            <h1 className="text-lg font-semibold hidden md:block">AudiScope Assistant</h1>
            <p className="text-sm text-muted-foreground truncate hidden md:block">
              {currentChat?.title || (messages.length > 0 ? `${messages.length} messages` : "New conversation")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              onClick={handleNewConversation}
              variant="outline" 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="min-h-full">
          {!conversationId && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-lg">
                <MessageSquareText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h2 className="text-xl font-semibold mb-2">Welcome to AudiScope Assistant</h2>
                <p className="text-muted-foreground mb-6">
                  Start a new conversation to get help with assessments, training protocols, 
                  and clinical procedures. I can analyze your data and provide insights based 
                  on the EVeNTS methodology.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Ask about assessment results and interpretations</p>
                  <p>• Get guidance on clinical best practices</p>
                  <p>• Explore communication and leadership patterns</p>
                  <p>• Reference knowledge base documents</p>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-lg">
                <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Ask me about your assessments, clinical procedures, or training protocols. 
                  I have access to your knowledge base and can provide detailed insights.
                </p>
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                />
              ))}
              {sendMessageMutation.isPending && (
                <Message
                  message={{
                    id: "loading",
                    content: "",
                    sender: "assistant",
                    timestamp: new Date(),
                    isLoading: true
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending || chatLoading || messagesLoading}
        placeholder="Ask about assessments, procedures, or clinical protocols..."
      />
    </div>
  )
}