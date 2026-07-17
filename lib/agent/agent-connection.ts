import { Subject } from "rxjs"
import { EventType, type BaseEvent } from "@ag-ui/client"
import type { AgentConnectionStatus, SessionResolvedFrame, SnapshotMessage } from "./types"

const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL

// The server always sends SESSION_RESOLVED as the very first frame; connect()
// resolves when it arrives.
const CONNECT_TIMEOUT_MS = 10_000
const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000]

// Auth seam: WebSockets can't carry an Authorization header. When the server
// enforces auth, attach the token here (query param or cookie) — nothing else
// in the client needs to change.
async function buildConnectionUrl(sessionId?: string | null): Promise<string> {
  if (!AGENT_WS_URL) {
    throw new Error("NEXT_PUBLIC_AGENT_WS_URL is not configured")
  }
  return sessionId ? `${AGENT_WS_URL}?session_id=${encodeURIComponent(sessionId)}` : AGENT_WS_URL
}

export type ClientFrame = { type: "run"; content: string } | { type: "cancel" }

/**
 * Owns one WebSocket to the agent server and routes its frames:
 * - SESSION_RESOLVED resolves the pending connect and is never forwarded
 * - RUN_ERROR(code:"busy") goes to onBusy and is never forwarded (it would
 *   illegally terminate the running turn in the SDK's verifyEvents pipeline)
 * - every other frame is emitted on events$ as an AG-UI event
 */
export class AgentConnection {
  readonly events$ = new Subject<BaseEvent>()
  /** Fires when the server rejects a run with RUN_ERROR(code:"busy"). */
  readonly busy$ = new Subject<void>()

  sessionId: string | null = null
  status: AgentConnectionStatus = "disconnected"

  onBusy?: () => void
  onStatusChange?: (status: AgentConnectionStatus) => void
  onUnexpectedClose?: () => void
  onSessionResolved?: (resolved: SessionResolvedFrame) => void
  /** Full session history, sent once per connection right after SESSION_RESOLVED. */
  onMessagesSnapshot?: (messages: SnapshotMessage[]) => void

  private ws: WebSocket | null = null
  private closedIntentionally = false
  private pendingConnect: {
    resolve: (resolved: SessionResolvedFrame) => void
    reject: (error: Error) => void
    timeout: ReturnType<typeof setTimeout>
  } | null = null

  async connect(sessionId?: string | null): Promise<SessionResolvedFrame> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionId) {
      return { type: "SESSION_RESOLVED", sessionId: this.sessionId, isNew: false }
    }
    this.teardownSocket()
    this.closedIntentionally = false
    this.setStatus("connecting")

    const url = await buildConnectionUrl(sessionId ?? this.sessionId)

    return new Promise<SessionResolvedFrame>((resolve, reject) => {
      const ws = new WebSocket(url)
      this.ws = ws

      const timeout = setTimeout(() => {
        this.pendingConnect = null
        this.teardownSocket()
        this.setStatus("disconnected")
        reject(new Error("Timed out waiting for SESSION_RESOLVED"))
      }, CONNECT_TIMEOUT_MS)

      this.pendingConnect = { resolve, reject, timeout }

      ws.onmessage = (event) => this.handleFrame(event.data)
      ws.onerror = () => {
        // onclose always follows onerror; failure handling lives there
      }
      ws.onclose = () => {
        if (this.ws !== ws) return
        this.ws = null
        this.setStatus("disconnected")
        if (this.pendingConnect) {
          clearTimeout(this.pendingConnect.timeout)
          const { reject: rejectConnect } = this.pendingConnect
          this.pendingConnect = null
          rejectConnect(new Error("Connection closed before SESSION_RESOLVED"))
          return
        }
        if (!this.closedIntentionally) {
          this.onUnexpectedClose?.()
        }
      }
    })
  }

  /** Reconnect (with backoff) to the stored session if the socket is down. */
  async ensureConnected(): Promise<string> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionId) {
      return this.sessionId
    }
    let lastError: Error = new Error("Not connected")
    for (const delay of [0, ...RECONNECT_DELAYS_MS]) {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay))
      try {
        const resolved = await this.connect(this.sessionId)
        return resolved.sessionId
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }
    throw lastError
  }

  send(frame: ClientFrame): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Agent connection is not open")
    }
    this.ws.send(JSON.stringify(frame))
  }

  close(): void {
    this.closedIntentionally = true
    if (this.pendingConnect) {
      clearTimeout(this.pendingConnect.timeout)
      this.pendingConnect.reject(new Error("Connection closed"))
      this.pendingConnect = null
    }
    this.teardownSocket()
    this.setStatus("disconnected")
  }

  private handleFrame(data: unknown): void {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(typeof data === "string" ? data : String(data))
    } catch {
      console.error("AgentConnection: unparseable frame", data)
      return
    }

    if (parsed.type === "SESSION_RESOLVED") {
      const resolved = parsed as unknown as SessionResolvedFrame
      this.sessionId = resolved.sessionId
      this.setStatus("ready")
      this.onSessionResolved?.(resolved)
      if (this.pendingConnect) {
        clearTimeout(this.pendingConnect.timeout)
        const { resolve } = this.pendingConnect
        this.pendingConnect = null
        resolve(resolved)
      }
      return
    }

    // Arrives once per connection, before any run — handled here (not in the
    // SDK run pipeline, which only exists while a run is active).
    if (parsed.type === EventType.MESSAGES_SNAPSHOT) {
      this.onMessagesSnapshot?.((parsed.messages as SnapshotMessage[]) ?? [])
      return
    }

    if (parsed.type === EventType.RUN_ERROR && (parsed as { code?: string }).code === "busy") {
      this.onBusy?.()
      this.busy$.next()
      return
    }

    this.events$.next(parsed as unknown as BaseEvent)
  }

  private teardownSocket(): void {
    if (this.ws) {
      const ws = this.ws
      this.ws = null
      ws.onmessage = null
      ws.onclose = null
      ws.onerror = null
      try {
        ws.close()
      } catch {
        // already closed
      }
    }
  }

  private setStatus(status: AgentConnectionStatus): void {
    if (this.status === status) return
    this.status = status
    this.onStatusChange?.(status)
  }
}
