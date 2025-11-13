'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatSession, useSendMessage } from '@/hooks/use-product-chat'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageSquareText, BookOpen, GraduationCap, HelpCircle } from 'lucide-react'
import { Message, type MessageType } from '@/components/assistant/message'
import { MessageInput } from '@/components/assistant/message-input'
import type { GetSessionResult, ChatMessage } from '@/lib/product-chat.service'

interface ChatSessionViewProps {
  sessionId: string
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

export function ChatSessionView({ sessionId, productId, productName }: ChatSessionViewProps) {
  const queryClient = useQueryClient()
  const { data: session, isLoading, error } = useChatSession(sessionId)
  const sendMessage = useSendMessage()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Derive messages directly from React Query cache - persists across remounts
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

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

      // Revert optimistic update and show error
      queryClient.invalidateQueries({ queryKey: ['chat-session', sessionId] })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading conversation...</span>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">Failed to load session</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Please try again'}
          </p>
        </div>
      </div>
    )
  }

  const typeConfig = SESSION_TYPE_CONFIG[session.session_type as keyof typeof SESSION_TYPE_CONFIG]
  const Icon = typeConfig?.icon || MessageSquareText

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* Session Header */}
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeConfig?.bgColor}`}>
            <Icon className={`h-5 w-5 ${typeConfig?.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{session.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs">
                {typeConfig?.label || session.session_type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {productName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Start the conversation</h4>
              <p className="text-sm text-muted-foreground">
                {typeConfig?.label === 'Q&A' && 'Ask any question about the product specifications, features, or clinical applications.'}
                {typeConfig?.label === 'Practice' && 'Practice demonstrating the product or handling common scenarios.'}
                {typeConfig?.label === 'Concepts' && 'Learn about key concepts, technologies, and features of the product.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
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

      {/* Message Input */}
      <div className="border-t flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessage.isPending}
          placeholder={`Ask about ${productName}...`}
        />
      </div>
    </div>
  )
}
