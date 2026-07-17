'use client'

import { useEffect, useRef } from 'react'
import { useAgentChat } from '@/hooks/use-agent-chat'
import { Message } from '@/components/assistant/message'
import { MessageInput } from '@/components/assistant/message-input'
import { Loader2, MessageSquareText } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'
import { CHAT_EVENTS } from '@/lib/analytics/posthog-events'

interface AgentChatViewProps {
  sessionId: string | null
  onSessionResolved: (sessionId: string) => void
}

export function AgentChatView({ sessionId, onSessionResolved }: AgentChatViewProps) {
  const {
    messages,
    status,
    isAwaiting,
    error,
    historyLoading,
    historyError,
    sendMessage,
    cancel,
  } = useAgentChat(sessionId, onSessionResolved)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionStartTracked = useRef(false)
  const posthog = usePostHog()

  // Track chat session started (once per mount in new-chat mode)
  useEffect(() => {
    if (!sessionId && !sessionStartTracked.current) {
      posthog?.capture(CHAT_EVENTS.CHAT_SESSION_STARTED)
      sessionStartTracked.current = true
    }
  }, [sessionId, posthog])

  // Auto-scroll to bottom as messages arrive/stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Full-screen states only when there's nothing to show: during a new
  // session's first turn the history query fires while the reply is still
  // streaming, and must not replace the live messages.
  if (historyLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading conversation...</span>
      </div>
    )
  }

  if (historyError && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">Failed to load conversation</p>
          <p className="text-sm text-muted-foreground mt-1">{historyError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-lg">
              <MessageSquareText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-2">Welcome to AudiScope Assistant</h2>
              <p className="text-muted-foreground mb-6">
                Start a conversation to get help with assessments, training protocols, and
                clinical procedures. I can analyze your data and provide insights based on the
                EVeNTS methodology.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Ask about assessment results and interpretations</p>
                <p>• Get guidance on clinical best practices</p>
                <p>• Explore communication and leadership patterns</p>
                <p>• Reference knowledge base documents</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isAwaiting && (
              <Message
                message={{
                  id: 'loading',
                  content: '',
                  sender: 'assistant',
                  timestamp: new Date(),
                  isLoading: true,
                }}
              />
            )}
            {error && (
              <div className="px-4 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={(content) => void sendMessage(content)}
          isStreaming={status === 'streaming'}
          onStop={cancel}
          placeholder="Ask about assessments, procedures, or clinical protocols..."
        />
      </div>
    </div>
  )
}
