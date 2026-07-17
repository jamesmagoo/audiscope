'use client'

import { useEffect, useRef, useState } from 'react'
import { useAgentChat } from '@/hooks/use-agent-chat'
import { Message } from '@/components/assistant/message'
import { MessageInput } from '@/components/assistant/message-input'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Persona } from '@/components/ai-elements/persona'
import { MotionConfig } from 'motion/react'
import { Loader2, Sparkles } from 'lucide-react'
import { usePostHog } from 'posthog-js/react'
import { CHAT_EVENTS } from '@/lib/analytics/posthog-events'

interface AgentChatViewProps {
  sessionId: string | null
  onSessionResolved: (sessionId: string) => void
}

const STARTER_PROMPTS = [
  'Explain the EVeNTS assessment methodology',
  'What does strong team communication look like during a procedure?',
  'Give me tips for running an effective post-procedure debrief',
]

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

  const sessionStartTracked = useRef(false)
  // Messages older than the mount (loaded history) render statically; only
  // live messages animate in.
  const mountTimeRef = useRef(Date.now())
  const posthog = usePostHog()

  // The latest assistant message carries the animated orb avatar (in place);
  // older rows use the static icon so only one WebGL canvas is live.
  const lastAssistantIndex = messages.findLastIndex((m) => m.sender === 'assistant')

  // Orb state when settled: listening while the user composes, asleep on error.
  const [isComposing, setIsComposing] = useState(false)
  const settledOrbState =
    status === 'error' ? 'asleep' : isComposing ? 'listening' : 'idle'

  // Track chat session started (once per mount in new-chat mode)
  useEffect(() => {
    if (!sessionId && !sessionStartTracked.current) {
      posthog?.capture(CHAT_EVENTS.CHAT_SESSION_STARTED)
      sessionStartTracked.current = true
    }
  }, [sessionId, posthog])

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
    <MotionConfig reducedMotion="user">
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* Messages Area */}
      {messages.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-lg">
              <div className="mx-auto mb-6 h-20 w-20">
                <Persona state={settledOrbState} variant="opal" className="h-full w-full" />
              </div>
              <h2 className="text-xl font-semibold mb-2">AudiScope Assistant</h2>
              <p className="text-muted-foreground mb-8">
                Ask about assessments, training protocols, and clinical procedures —
                grounded in your knowledge base and the EVeNTS methodology.
              </p>
              <div className="flex flex-col items-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="group inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary/60 transition-colors group-hover:text-primary" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // The absolute-inset anchor gives StickToBottom's internal
        // height-100% scroller a definite height regardless of how ancestors
        // resolve flex/grid sizing — without it, long content grows the pane
        // and pushes the input off screen.
        <div className="relative flex-1 min-h-0">
          <Conversation className="absolute inset-0">
            <ConversationContent className="gap-0 p-0 py-4">
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  animateIn={message.timestamp.getTime() > mountTimeRef.current}
                  personaAvatar={
                    !isAwaiting &&
                    message.sender === 'assistant' &&
                    index === lastAssistantIndex
                  }
                  personaIdleState={settledOrbState}
                />
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
                  animateIn
                />
              )}
              {error && (
                <div className="mx-4 my-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={(content) => void sendMessage(content)}
          isStreaming={status === 'streaming'}
          onStop={cancel}
          onComposingChange={setIsComposing}
          placeholder="Ask about assessments, procedures, or clinical protocols..."
        />
      </div>
    </div>
    </MotionConfig>
  )
}
