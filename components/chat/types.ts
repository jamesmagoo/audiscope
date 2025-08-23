export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  relatedDocuments?: string[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
}

export interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  content?: string
}
