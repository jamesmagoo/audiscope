'use client'

import { useState } from 'react'
import { useAgentSessions, useDeleteAgentSession } from '@/hooks/use-agent-sessions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, MessageSquare, Trash2, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { usePostHog } from 'posthog-js/react'
import { CHAT_EVENTS } from '@/lib/analytics/posthog-events'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AgentSessionsListProps {
  activeSessionId: string | null
  onSelectSession: (sessionId: string | null) => void
}

export function AgentSessionsList({ activeSessionId, onSelectSession }: AgentSessionsListProps) {
  const { data: sessions = [], isLoading, error } = useAgentSessions()
  const deleteSession = useDeleteAgentSession()
  const posthog = usePostHog()

  const [searchQuery, setSearchQuery] = useState('')
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const filteredSessions = sessions.filter((session) => {
    const query = searchQuery.toLowerCase()
    return (
      session.title.toLowerCase().includes(query) ||
      (session.preview ?? '').toLowerCase().includes(query)
    )
  })

  const handleSelectSession = (sessionId: string) => {
    posthog?.capture(CHAT_EVENTS.CONVERSATION_SELECTED, { conversationId: sessionId })
    onSelectSession(sessionId)
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      await deleteSession.mutateAsync(sessionToDelete)
      if (sessionToDelete === activeSessionId) {
        onSelectSession(null)
      }
      setSessionToDelete(null)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col h-full min-h-0">
        {/* Header */}
        <div className="p-3 border-b flex-shrink-0 space-y-2">
          <Button onClick={() => onSelectSession(null)} className="w-full h-8 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Chat
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Sessions List - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-3 text-center">
                <p className="text-xs text-destructive">Error loading conversations</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-3 text-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'No matches' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Send a message to start
                  </p>
                )}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId

                return (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative flex items-start gap-2 rounded-md p-2 cursor-pointer transition-colors',
                      isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                    )}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-primary/10">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-medium truncate">{session.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionToDelete(session.id)
                          }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {session.message_count > 0 && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {session.message_count} msgs
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
