"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Send, MessageSquare } from "lucide-react"

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
      title: "Medical Analysis Discussion",
      messages: [
        {
          id: "1",
          content: "Hello! How can I help you with your medical analysis today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      lastMessage: new Date(),
    },
  ])

  const [activeConversationId, setActiveConversationId] = useState<string>("1")
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [
        {
          id: Date.now().toString(),
          content: "Hello! How can I help you today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      lastMessage: new Date(),
    }

    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)
  }

  const sendMessage = async () => {
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
              title: conv.messages.length === 1 ? inputMessage.slice(0, 30) + "..." : conv.title,
            }
          : conv,
      ),
    )

    setInputMessage("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I understand your question. Let me help you with that analysis. This is a simulated response for now.",
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
      setIsLoading(false)
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
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewConversation}
            className="w-full justify-start gap-2 bg-transparent"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  activeConversationId === conversation.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conversation.lastMessage.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{activeConversation.title}</h2>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
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
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent">U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-current rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
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
