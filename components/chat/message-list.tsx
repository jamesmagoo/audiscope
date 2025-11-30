"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Message } from "./types"

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>

              {message.relatedDocuments && message.relatedDocuments.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/20">
                  <p className="text-xs text-muted-foreground mb-2">Referenced documents:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.relatedDocuments.map((docName, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {docName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p
                className={`text-xs mt-2 ${
                  message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary">U</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
