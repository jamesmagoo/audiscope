'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MessageSquareText } from 'lucide-react'
import { ChatSessionsList } from './chat-sessions-list'
import { ChatSessionView } from './chat-session-view'

interface ProductChatTabProps {
  productId: string
  productName: string
  activeSessionId: string | null
  onSessionIdChange: (sessionId: string | null) => void
}

export function ProductChatTab({
  productId,
  productName,
  activeSessionId,
  onSessionIdChange
}: ProductChatTabProps) {
  const handleNewSession = () => {
    // Clear active session to show new session UI
    onSessionIdChange(null)
  }

  const handleSelectSession = (sessionId: string) => {
    onSessionIdChange(sessionId)
  }

  return (
    <div className="h-full overflow-hidden min-h-0">
      <Card className="h-full overflow-hidden min-h-0">
        <CardContent className="p-0 h-full overflow-hidden min-h-0">
          <div className="grid grid-cols-12 gap-0 h-full min-h-0">
          {/* Left sidebar: Chat session list */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r h-full overflow-hidden min-h-0">
            <ChatSessionsList
              productId={productId}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
            />
          </div>

          {/* Right main area: Active chat */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full overflow-hidden min-h-0">
            {activeSessionId ? (
              <ChatSessionView
                sessionId={activeSessionId}
                productId={productId}
                productName={productName}
              />
            ) : (
              <EmptyState productName={productName} />
            )}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ productName }: { productName: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <MessageSquareText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h3 className="text-xl font-semibold mb-2">Chat about {productName}</h3>
        <p className="text-muted-foreground mb-6">
          Start a new conversation to ask questions about product specifications,
          clinical applications, competitive positioning, and more.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Get instant answers from product documentation</p>
          <p>• Practice product demonstrations</p>
          <p>• Learn key concepts and features</p>
        </div>
      </div>
    </div>
  )
}
