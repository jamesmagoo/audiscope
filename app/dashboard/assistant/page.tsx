"use client"

import { useState } from "react"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatArea } from "@/components/chat/chat-area"
import type { Conversation, Document, Message } from "@/components/chat/types"

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

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

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

  const handleFileUpload = (files: FileList) => {
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
  }

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
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

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversations}
        documents={documents}
        activeConversationId={activeConversationId}
        onConversationSelect={setActiveConversationId}
        onNewConversation={createNewConversation}
        onFileUpload={handleFileUpload}
        onDeleteDocument={deleteDocument}
      />

      <ChatArea
        conversation={activeConversation}
        documents={documents}
        inputMessage={inputMessage}
        onInputChange={setInputMessage}
        onSendMessage={sendMessage}
      />
    </div>
  )
}
