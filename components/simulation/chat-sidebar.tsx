'use client'

import { ChevronLeft, ChevronRight, User2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Message, MessageContent, MessageAvatar } from '@/components/ui/message'
import { AudioPlayer } from './audio-player'
import type { ChatMessage } from '@/hooks/use-chat-history'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  messages: ChatMessage[]
  collapsed: boolean
  onToggle: () => void
  className?: string
}

export function ChatSidebar({ messages, collapsed, onToggle, className }: ChatSidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col border-l border-border bg-background transition-all duration-300',
        collapsed ? 'w-14' : 'w-96',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        {!collapsed && (
          <h3 className="font-semibold text-sm">Conversation</h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn('h-8 w-8 p-0', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Messages */}
      {!collapsed && (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Start speaking to begin the conversation.
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  from={message.role === 'user' ? 'user' : 'assistant'}
                >
                  <MessageAvatar
                    src={message.role === 'user' ? '' : ''}
                    name={message.role === 'user' ? 'You' : 'AI'}
                  >
                    {message.role === 'user' ? (
                      <User2 className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </MessageAvatar>
                  <MessageContent
                    variant={message.role === 'user' ? 'contained' : 'flat'}
                  >
                    {/* Turn Number */}
                    {message.turnNumber && (
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Turn {message.turnNumber}
                      </div>
                    )}

                    {/* Text Content */}
                    {message.text && (
                      <div className="text-sm whitespace-pre-wrap mb-2">
                        {message.text}
                      </div>
                    )}

                    {/* Audio Player */}
                    {message.audioUrl && (
                      <AudioPlayer
                        url={message.audioUrl}
                        duration={message.duration}
                        className="mt-2"
                      />
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </MessageContent>
                </Message>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
