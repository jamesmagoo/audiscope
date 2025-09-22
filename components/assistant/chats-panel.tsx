"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageSquareText, Loader2, Plus, Search, MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ChatMessage, type Chat } from "@/lib/knowlege-base.service"
import { useChats, useDeleteChat } from "@/hooks/use-knowledge-base"
import { formatDistanceToNow } from "date-fns"

// Use the Chat type from the API instead
interface ChatsUI extends Chat {
  lastMessage?: string
  messageCount?: number
}

interface ChatsPanelProps {
  activeConversationId: string | null
  onSelectConversation: (id: string | null) => void
  onConversationCreated?: (chat: Chat) => void
}

export function ChatsPanel({ activeConversationId, onSelectConversation, onConversationCreated }: ChatsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use React Query hooks
  const { data: chats = [], isPending, error, refetch } = useChats()
  const deleteChat = useDeleteChat()
  
  // Convert API chats to UI format
  const conversations: ChatsUI[] = chats.map((chat : ChatMessage) => ({
    ...chat,
    lastMessage: undefined, // API doesn't provide last message yet
    messageCount: 0 // API doesn't provide message count yet
  }))

  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conversation.lastMessage && conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleNewConversation = () => {
    // For new conversations, we'll let the chat interface handle creation
    // when the first message is sent
    onSelectConversation(null)
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteChat.mutateAsync(id)
      if (activeConversationId === id) {
        onSelectConversation(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      // Show user-friendly error message
    }
  }

  return (
    <Card className="h-full rounded-none border-0 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button 
            onClick={handleNewConversation}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-0 flex-1">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Separator className="mb-4" />

        {/* Conversations List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {isPending ?  
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <span className="ml-2 text-sm">Loading chats...</span>
                </div>
            : filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                  activeConversationId === conversation.id ? "bg-muted border-primary" : "border-border"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate mb-1">
                      {conversation.title}
                    </h4>
                    {conversation.lastMessage && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {conversation.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.updated_at),{ includeSeconds: true, addSuffix: true })}
                      </span>
                      {conversation.messageCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {conversation.messageCount} messages
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conversation.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
          
          {!isPending && filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
