"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusIcon, MessageSquareIcon } from "lucide-react"
import type { Conversation } from "./types"

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId: string
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
}

export function ConversationList({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationListProps) {
  return (
    <>
      <div className="px-4 pb-4 border-b border-border">
        <Button onClick={onNewConversation} className="w-full justify-start gap-2 bg-transparent" variant="outline">
          <PlusIcon className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
              className={`w-full p-3 rounded-lg text-left hover:bg-accent transition-colors mb-1 ${
                activeConversationId === conversation.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <MessageSquareIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conversation.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{conversation.lastMessage.toLocaleDateString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </>
  )
}
