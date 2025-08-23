"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  PlusIcon,
  SendIcon,
  MessageSquareIcon,
  FileTextIcon,
  UploadIcon,
  TrashIcon,
  DownloadIcon,
  SearchIcon,
} from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  relatedDocuments?: string[]
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  content?: string
}

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Medical Case Analysis",
      messages: [
        {
          id: "1",
          content:
            "Hello! I can help you analyze medical cases using your knowledge base. Upload documents to get started.",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      lastMessage: new Date(),
    },
  ])

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Surgical Guidelines 2024.pdf",
      type: "application/pdf",
      size: 2048000,
      uploadDate: new Date(Date.now() - 86400000),
    },
    {
      id: "2",
      name: "Patient Assessment Protocol.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1024000,
      uploadDate: new Date(Date.now() - 172800000),
    },
  ])

  const [activeConversationId, setActiveConversationId] = useState<string>("1")
  const [inputMessage, setInputMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  const filteredDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [
        {
          id: "1",
          content: "Hello! How can I assist you with your medical knowledge base today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
      lastMessage: new Date(),
    }

    setConversations((prev) => [newConversation, ...prev])
    setActiveConversationId(newId)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const newDocument: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
      }

      setDocuments((prev) => [newDocument, ...prev])
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeConversation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    }

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

    setTimeout(() => {
      const relatedDocs = documents.slice(0, 2).map((doc) => doc.name)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Based on your knowledge base, I've found relevant information in your uploaded documents. Let me analyze this medical case using the available resources.`,
        role: "assistant",
        timestamp: new Date(),
        relatedDocuments: relatedDocs,
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
      {/* Sidebar - Conversations and Knowledge Base */}
      <div className="w-80 border-r border-border bg-card">
        <Tabs defaultValue="conversations" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 mb-2">
            <TabsTrigger value="conversations">Chats</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="flex-1 mt-0">
            <div className="px-4 pb-4 border-b border-border">
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
              <div className="px-4 py-2">
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
          </TabsContent>

          <TabsContent value="knowledge" className="flex-1 mt-0">
            <div className="px-4 pb-4 border-b border-border space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Documents
              </Button>

              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-2">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground">
                    {documents.length} document{documents.length !== 1 ? "s" : ""} in knowledge base
                  </p>
                </div>

                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="p-3 rounded-lg border border-border mb-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileTextIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{document.name}</p>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">Synced</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(document.size)} • {document.uploadDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <DownloadIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteDocument(document.id)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredDocuments.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No documents found</p>
                  </div>
                )}

                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload files to build your knowledge base</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <h1 className="font-semibold text-lg">Product Assistant</h1>
              <p className="text-sm text-muted-foreground">
                AI Medical Assistant • {documents.length} documents available
              </p>
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

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about your documents, medical cases, or get assistance..."
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
