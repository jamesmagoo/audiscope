import {
  AbstractAgent,
  EventType,
  type AgentConfig,
  type BaseEvent,
  type RunAgentInput,
} from "@ag-ui/client"
import { Observable } from "rxjs"
import type { AgentConnection } from "./agent-connection"

function textContentOf(message: { content?: unknown } | undefined): string {
  if (!message || typeof message.content !== "string") return ""
  return message.content
}

/**
 * AG-UI transport over the agent server's WebSocket. The server owns history
 * and only needs the new user message's text (`{type:"run", content}`), so the
 * agent's message list is never seeded with prior turns — the hook adds the
 * one new user message before calling runAgent().
 */
export class WebSocketAgent extends AbstractAgent {
  constructor(
    private connection: AgentConnection,
    config?: AgentConfig,
  ) {
    super(config)
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((observer) => {
      const lastUserMessage = [...input.messages].reverse().find((m) => m.role === "user")

      const finishWithConnectionLost = () => {
        observer.next({
          type: EventType.RUN_ERROR,
          message: "Connection to the assistant was lost",
          code: "connection_lost",
        } as BaseEvent)
        observer.complete()
      }

      const subscription = this.connection.events$.subscribe((event) => {
        observer.next(event)
        if (event.type === EventType.RUN_FINISHED || event.type === EventType.RUN_ERROR) {
          observer.complete()
        }
      })

      // Server rejected this run (a turn is already in flight, e.g. from
      // another tab). Complete with no events; the hook detects the silent
      // completion and resets.
      const busySubscription = this.connection.busy$.subscribe(() => {
        observer.complete()
      })

      const previousOnClose = this.connection.onUnexpectedClose
      this.connection.onUnexpectedClose = () => {
        previousOnClose?.()
        finishWithConnectionLost()
      }

      this.connection
        .ensureConnected()
        .then(() => {
          this.connection.send({ type: "run", content: textContentOf(lastUserMessage) })
        })
        .catch(() => finishWithConnectionLost())

      return () => {
        subscription.unsubscribe()
        busySubscription.unsubscribe()
        this.connection.onUnexpectedClose = previousOnClose
      }
    })
  }

  // The server ends a cancelled turn with RUN_ERROR(code:"interrupted"),
  // which terminates the run through the normal event flow.
  abortRun(): void {
    try {
      this.connection.send({ type: "cancel" })
    } catch {
      // socket already gone; the close handler ends the run
    }
  }
}
