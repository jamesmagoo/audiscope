"use client"

import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import type { Conversation, Document } from "./types"

interface ChatAreaProps {
  conversation: Conversation | undefined
  documents: Document[]
  inputMessage: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
}

export function ChatArea({ conversation, documents, inputMessage, onInputChange, onSendMessage }: ChatAreaProps) {
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <h1 className="font-semibold text-lg">Product Assistant</h1>
        <p className="text-sm text-muted-foreground">AI Medical Assistant • {documents.length} documents available</p>
      </div>

      {/* Messages */}
      <MessageList messages={conversation.messages} />

      {/* Input Area */}
      <MessageInput value={inputMessage} onChange={onInputChange} onSend={onSendMessage} />
    </div>
  )
}
