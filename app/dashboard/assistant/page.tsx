"use client"

import { useCallback, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AgentSessionsList } from "@/components/assistant/agent-sessions-list"
import { AgentChatView } from "@/components/assistant/agent-chat-view"

export default function AssistantPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // A new chat gets its id from the server (SESSION_RESOLVED) on first send;
  // adopt it so the list highlights it and history survives navigation.
  const handleSessionResolved = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [])

  return (
    <div className="h-full min-h-0 p-4">
      <Card className="h-full min-h-0">
        <CardContent className="p-0 h-full min-h-0">
          <div className="grid grid-cols-12 gap-0 h-full min-h-0">
            {/* Left sidebar: Conversations */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 border-r h-full overflow-hidden min-h-0">
              <AgentSessionsList
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
              />
            </div>

            {/* Right main area: Chat */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full overflow-hidden min-h-0">
              <AgentChatView
                sessionId={activeSessionId}
                onSessionResolved={handleSessionResolved}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
