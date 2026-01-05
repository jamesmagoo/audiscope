'use client'

import { useState } from 'react'
import { useProductChat, useStartSession, useDeleteSession } from '@/hooks/use-product-chat'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  BookOpen,
  GraduationCap,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

interface MobileSessionsTabProps {
  productId: string
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
}

const SESSION_TYPE_CONFIG = {
  qa: {
    label: 'Q&A',
    icon: HelpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Ask questions about the product'
  },
  practice: {
    label: 'Practice',
    icon: GraduationCap,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Practice product demonstrations'
  },
  concept: {
    label: 'Concepts',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Learn key concepts and features'
  }
}

export function MobileSessionsTab({
  productId,
  activeSessionId,
  onSelectSession
}: MobileSessionsTabProps) {
  const { sessions, isLoading, error } = useProductChat(productId)
  const startSession = useStartSession()
  const deleteSession = useDeleteSession()

  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState('')
  const [selectedType, setSelectedType] = useState<'qa' | 'practice' | 'concept'>('qa')
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const handleCreateSession = async () => {
    try {
      const result = await startSession.mutateAsync({
        productId,
        sessionType: selectedType,
        title: newSessionTitle || undefined
      })

      // Select the newly created session and switch to chat tab
      onSelectSession(result.session_id)

      // Reset form
      setShowNewSessionDialog(false)
      setNewSessionTitle('')
      setSelectedType('qa')
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      await deleteSession.mutateAsync(sessionToDelete)
      setSessionToDelete(null)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* New Chat FAB Button - Fixed at top */}
        <div className="p-4 border-b bg-background flex-shrink-0">
          <Button
            onClick={() => setShowNewSessionDialog(true)}
            className="w-full h-11 text-sm font-medium"
            disabled={startSession.isPending}
          >
            {startSession.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </>
            )}
          </Button>
        </div>

        {/* Sessions List - Scrollable */}
        <ScrollArea className="flex-1 w-full">
          <div className="p-3 space-y-2 w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-destructive">Error loading sessions</p>
                <p className="text-xs text-muted-foreground mt-1">Please try again</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No chats yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tap "New Chat" to start a conversation
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const typeConfig = SESSION_TYPE_CONFIG[session.session_type as keyof typeof SESSION_TYPE_CONFIG]
                const Icon = typeConfig?.icon || MessageSquare
                const isActive = session.session_id === activeSessionId

                return (
                  <div
                    key={session.session_id}
                    className={cn(
                      'group relative flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-all',
                      isActive
                        ? 'bg-primary/10 border-2 border-primary/30 shadow-sm'
                        : 'bg-muted/50 border-2 border-transparent active:bg-muted'
                    )}
                    onClick={() => onSelectSession(session.session_id)}
                  >
                    {/* Icon */}
                    <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', typeConfig?.bgColor)}>
                      <Icon className={cn('h-5 w-5', typeConfig?.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium truncate flex-1">{session.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionToDelete(session.session_id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {typeConfig?.label || session.session_type}
                        </Badge>
                        {session.message_count !== undefined && session.message_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {session.message_count} {session.message_count === 1 ? 'msg' : 'msgs'}
                          </span>
                        )}
                      </div>

                      {session.last_message_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(session.last_message_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Choose the type of conversation you want to have
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Type</Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(SESSION_TYPE_CONFIG).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type as 'qa' | 'practice' | 'concept')}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors min-h-[60px]',
                        selectedType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border active:border-primary/50'
                      )}
                    >
                      <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', config.bgColor)}>
                        <Icon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{config.label}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Session Title (Optional)</Label>
              <Input
                id="title"
                placeholder={`${SESSION_TYPE_CONFIG[selectedType].label} Session`}
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleCreateSession} disabled={startSession.isPending} className="w-full sm:w-auto">
              {startSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Start Chat'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto m-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
