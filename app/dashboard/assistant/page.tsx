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
    // Cap height to the viewport minus the layout's h-16 header. SidebarInset
    // is min-h-svh (not a fixed height), so h-full/flex-1 would let a tall
    // session list grow the page past the screen and push the chat input off
    // the bottom. A hard height here bounds the internal grid + scroll regions.
    <div className="h-[calc(100svh-4rem)] min-h-0 p-4">
      <Card className="h-full min-h-0">
        <CardContent className="p-0 h-full min-h-0">
          <div className="grid grid-cols-12 grid-rows-1 gap-0 h-full min-h-0">
            {/* Left sidebar: Conversations. flex (not block) so the list's
                h-full resolves against a definite height and its inner
                overflow-y-auto engages instead of growing the column. */}
            <div className="hidden md:flex md:flex-col md:col-span-4 lg:col-span-3 border-r h-full overflow-hidden min-h-0 min-w-0">
              <AgentSessionsList
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
              />
            </div>

            {/* Right main area: Chat */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full overflow-hidden min-h-0 min-w-0">
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
