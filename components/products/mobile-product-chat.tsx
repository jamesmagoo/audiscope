'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MobileChatHeader } from './mobile-chat-header'
import { MobileSessionsTab } from './mobile-sessions-tab'
import { MobileChatTab } from './mobile-chat-tab'
import { MessageSquare, List } from 'lucide-react'

interface MobileProductChatProps {
  productId: string
  productName: string
  productTitle?: string
  files: any[]
}

export function MobileProductChat({
  productId,
  productName,
  productTitle,
  files
}: MobileProductChatProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'chat'>('sessions')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // When a session is selected, switch to chat tab
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId)
    setActiveTab('chat')
  }

  return (
    <div className="flex flex-col h-full w-screen max-w-full md:hidden overflow-hidden">
      {/* Header with Files & Sources */}
      <MobileChatHeader
        productTitle={productTitle || productName}
        files={files}
      />

      {/* Tabbed Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'sessions' | 'chat')}
        className="flex-1 flex flex-col w-full max-w-full min-h-0 overflow-hidden"
      >
        {/* Tab Triggers */}
        <TabsList className="w-full max-w-full grid grid-cols-2 rounded-none border-b h-12 bg-muted/30 flex-shrink-0">
          <TabsTrigger
            value="sessions"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 gap-2"
          >
            <List className="h-4 w-4" />
            <span className="font-medium">Sessions</span>
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab Content */}
        <TabsContent
          value="sessions"
          className="flex-1 m-0 overflow-hidden min-h-0 w-full max-w-full"
        >
          <MobileSessionsTab
            productId={productId}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
          />
        </TabsContent>

        {/* Chat Tab Content */}
        <TabsContent
          value="chat"
          className="flex-1 m-0 overflow-hidden min-h-0 w-full max-w-full"
        >
          <MobileChatTab
            sessionId={activeSessionId}
            productId={productId}
            productName={productName}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
