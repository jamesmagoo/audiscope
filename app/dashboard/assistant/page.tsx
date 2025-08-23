"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PlusIcon, SendIcon, MessageSquareIcon } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
}

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Medical Case Analysis",
      messages: [
        {
          id: "1",
          content: "Hello! How can I help you with your medical case today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      lastMessage: new Date(),
    },
  ])

  const [activeConversationId, setActiveConversationId] = useState<string>("1")
  const [inputMessage, setInputMessage] = useState("")

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [
        {
          id: "1",
          content: "Hello! How can I assist you today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      lastMessage: new Date(),
    }

    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newId)
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeConversation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    }

    // Add user message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              lastMessage: new Date(),
              title: conv.title === "New Conversation" ? inputMessage.slice(0, 30) + "..." : conv.title,
            }
          : conv,
      ),
    )

    setInputMessage("")

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I understand your question. Let me analyze this medical case and provide you with a comprehensive assessment based on the available information.",
        role: "assistant",
        timestamp: new Date(),
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                lastMessage: new Date(),
              }
            : conv,
        ),
      )
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewConversation}
            className="w-full justify-start gap-2 bg-transparent"
            variant="outline"
          >
            <PlusIcon className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className={`w-full p-3 rounded-lg text-left hover:bg-accent transition-colors mb-1 ${
                  activeConversationId === conversation.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquareIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conversation.lastMessage.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <h1 className="font-semibold text-lg">{activeConversation.title}</h1>
              <p className="text-sm text-muted-foreground">AI Medical Assistant</p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
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

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about medical cases, symptoms, or get assistance..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!inputMessage.trim()} size="icon">
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
