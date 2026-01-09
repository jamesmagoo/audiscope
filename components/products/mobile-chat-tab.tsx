'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatSession, useSendMessage } from '@/hooks/use-chat'
import { Loader2, MessageSquareText, BookOpen, GraduationCap, HelpCircle } from 'lucide-react'
import { Message, type MessageType } from '@/components/assistant/message'
import { MessageInput } from '@/components/assistant/message-input'
import type { GetSessionResult, ChatMessage } from '@/lib/product-chat.service'

interface MobileChatTabProps {
  sessionId: string | null
  productId: string
  productName: string
}

const SESSION_TYPE_CONFIG = {
  qa: {
    label: 'Q&A',
    icon: HelpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  practice: {
    label: 'Practice',
    icon: GraduationCap,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  concept: {
    label: 'Concepts',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
}

export function MobileChatTab({ sessionId, productId, productName }: MobileChatTabProps) {
  const queryClient = useQueryClient()
  const { data: session, isLoading, error } = useChatSession(sessionId || '')
  const sendMessage = useSendMessage()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Derive messages directly from React Query cache
  const messages: MessageType[] = useMemo(() => {
    if (!session?.messages) return []

    return session.messages.map((msg) => ({
      id: msg.id || `msg-${Date.now()}-${Math.random()}`,
      content: msg.content,
      sender: msg.role,
      timestamp: new Date(msg.created_at)
    }))
  }, [session?.messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return

    // Create optimistic user message
    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      content,
      role: 'user',
      created_at: new Date().toISOString()
    }

    // Optimistically update React Query cache
    queryClient.setQueryData<GetSessionResult>(
      ['chat-session', sessionId],
      (old) => {
        if (!old) return old
        return {
          ...old,
          messages: [...(old.messages || []), tempUserMessage],
          message_count: (old.message_count || 0) + 1,
          last_message_at: tempUserMessage.created_at
        }
      }
    )

    try {
      await sendMessage.mutateAsync({
        sessionId,
        content
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['chat-session', sessionId] })
    }
  }

  // No session selected state
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-sm">
          <MessageSquareText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No chat selected</h3>
          <p className="text-sm text-muted-foreground">
            Switch to the Sessions tab to start a new chat or select an existing one
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <span className="text-sm text-muted-foreground">Loading conversation...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <p className="text-destructive font-medium mb-1">Failed to load session</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Please try again'}
          </p>
        </div>
      </div>
    )
  }

  const typeConfig = SESSION_TYPE_CONFIG[session.session_type as keyof typeof SESSION_TYPE_CONFIG]

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Messages Area - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 w-full"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm px-4">
              <MessageSquareText className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-base font-medium mb-2">Start the conversation</h4>
              <p className="text-sm text-muted-foreground">
                {typeConfig?.label === 'Q&A' && 'Ask any question about the product specifications, features, or clinical applications.'}
                {typeConfig?.label === 'Practice' && 'Practice demonstrating the product or handling common scenarios.'}
                {typeConfig?.label === 'Concepts' && 'Learn about key concepts, technologies, and features of the product.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {sendMessage.isPending && (
              <Message
                message={{
                  id: 'loading',
                  content: '',
                  sender: 'assistant',
                  timestamp: new Date(),
                  isLoading: true
                }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="border-t bg-background flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessage.isPending || !sessionId}
          placeholder={`Ask about ${productName}...`}
        />
      </div>
    </div>
  )
}
