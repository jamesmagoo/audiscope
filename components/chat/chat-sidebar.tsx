"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationList } from "./conversation-list"
import { KnowledgeBase } from "./knowledge-base"
import type { Conversation, Document } from "./types"

interface ChatSidebarProps {
  conversations: Conversation[]
  documents: Document[]
  activeConversationId: string
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
  onFileUpload: (files: FileList) => void
  onDeleteDocument: (docId: string) => void
}

export function ChatSidebar({
  conversations,
  documents,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onFileUpload,
  onDeleteDocument,
}: ChatSidebarProps) {
  return (
    <div className="w-80 border-r border-border bg-card">
      <Tabs defaultValue="conversations" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4 mb-2">
          <TabsTrigger value="conversations">Chats</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="flex-1 mt-0 px-4">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onConversationSelect={onConversationSelect}
            onNewConversation={onNewConversation}
          />
        </TabsContent>

        <TabsContent value="knowledge" className="flex-1 mt-0 px-4">
          <KnowledgeBase documents={documents} onFileUpload={onFileUpload} onDeleteDocument={onDeleteDocument} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
