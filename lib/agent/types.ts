// Types for the AG-UI agent server integration.
// HTTP shapes mirror ai_docs/agent-server-http-contract.md; the WS event
// shapes come from @ag-ui/core via @ag-ui/client.

export interface AgentSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  preview?: string | null
}

export interface SnapshotMessage {
  id: string
  role: "user" | "assistant"
  content: string
  /** ISO 8601 UTC — extra field beyond the AG-UI base message shape. */
  createdAt?: string
}

export type AgentConnectionStatus = "disconnected" | "connecting" | "ready"

export interface SessionResolvedFrame {
  type: "SESSION_RESOLVED"
  sessionId: string
  isNew: boolean
}
