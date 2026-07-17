# Assistant Chat Architecture (AG-UI / WebSocket)

## Overview

The AudiScope Assistant (`app/dashboard/assistant/`) is a streaming chat UI
backed by a separate FastAPI **agent server** speaking the
[AG-UI protocol](https://docs.ag-ui.com/) over WebSocket. Replies stream
token-by-token, turns can be cancelled mid-stream, and sessions resume
server-side. The server contract lives in
[`agent-server-http-contract.md`](./agent-server-http-contract.md).

> The separate **Product Chat** system (`lib/chat.service.ts`,
> `components/products/*`) still uses the Core API request/response flow and is
> not covered here — though its UI was the template for this one.

## Component / layer map

```
app/dashboard/assistant/page.tsx          # Card + 12-col grid shell; holds activeSessionId
├── components/assistant/agent-sessions-list.tsx  # sidebar: list/search/delete (HTTP + React Query)
└── components/assistant/agent-chat-view.tsx      # chat pane; drives useAgentChat
    ├── components/assistant/message.tsx          # shared renderer (also used by Product Chat)
    └── components/assistant/message-input.tsx    # textarea + send/stop button

hooks/use-agent-chat.ts        # streaming core: connection lifecycle + message state
hooks/use-agent-sessions.ts    # React Query: session list + delete
lib/agent.service.ts           # HTTP client (list/delete sessions)
lib/agent/agent-connection.ts  # raw WebSocket owner + frame router
lib/agent/websocket-agent.ts   # @ag-ui/client AbstractAgent subclass (WS transport)
lib/agent/types.ts             # session/snapshot wire types
```

`@ag-ui/client` is pinned **exactly** (pre-1.0, breaking changes between
patches) — upgrade deliberately.

## Transport model

- **WebSocket** (`NEXT_PUBLIC_AGENT_WS_URL`, e.g. `ws://localhost:8000/ws/agent`)
  carries everything conversational: AG-UI events in (RUN_STARTED,
  TEXT_MESSAGE_*, RUN_FINISHED, RUN_ERROR, MESSAGES_SNAPSHOT), two client
  frames out (`{type:"run",content}` / `{type:"cancel"}`). Next.js rewrites
  cannot proxy WebSockets, so the browser connects **directly** (CORS on the
  server; `wss://` in production).
- **HTTP** (`NEXT_PUBLIC_AGENT_API_URL`) carries only the sidebar:
  `GET /api/agent/sessions` and `DELETE /api/agent/sessions/{id}`, via
  `makeAuthenticatedRequest` (Cognito Bearer token, tolerated-not-enforced by
  the server for now).

### Frame routing (`AgentConnection`)

Three frame kinds never enter the SDK's run pipeline (its `verifyEvents` is
strict about run shape) and are routed to callbacks instead:

| frame | routed to |
|---|---|
| `SESSION_RESOLVED` | resolves `connect()`; `onSessionResolved` |
| `MESSAGES_SNAPSHOT` | `onMessagesSnapshot` (once per connection, after SESSION_RESOLVED) |
| `RUN_ERROR code:"busy"` | `onBusy` (toast); the pending run completes empty and the hook resets |

Everything else flows through `events$` into `WebSocketAgent.run()`'s
Observable, and the SDK's `AgentSubscriber` machinery delivers assembled
callbacks (`textMessageBuffer` — no manual delta concatenation).

## Message state: socket as single source of truth

There is **no HTTP history fetch and no React Query cache for messages**. One
reducer in `use-agent-chat.ts` holds:

- `committed: MessageType[]` — seeded by the connection's `MESSAGES_SNAPSHOT`,
  appended to when a turn finishes (or is cancelled — see below).
- Live-turn overlay: `phase` (`idle | awaiting | streaming`), `pendingUser`
  (optimistic echo), `draft` (the streaming assistant bubble).

Rendered messages = `committed + pendingUser + draft`. Socket ordering makes
races impossible by construction. A reconnect's snapshot **replaces
`committed` but never touches the live turn** (a new chat's first send opens
the connection lazily *after* the user message is already pending, and the
empty snapshot arrives mid-turn).

React Query is still used for the **session list** (`['agent-sessions']`),
invalidated after each finished turn so ordering/titles/new sessions appear.

## Session id lifecycle

- **New chat** (`activeSessionId === null`): no connection until first send
  (eager connect would mint an empty server session per page view). On first
  send: connect with no id → server mints one → `SESSION_RESOLVED
  {isNew:true}` → the hook fires `onSessionCreated` (event-driven — deriving
  adoption from state comparison in an effect races with the New Chat button
  and re-adopts the old id) → the page adopts the id; the hook keeps the live
  connection since it's already bound to it.
- **Existing session**: selection change disposes the old connection and
  connects with `?session_id=<id>`; the server honors supplied ids verbatim
  (`isNew:false` always) and the snapshot renders history.
- Ids live only in page state + the socket; nothing is persisted client-side.
  Refresh returns to new-chat; past sessions come from the sidebar list.

## Turn lifecycle & error handling

`sendMessage` guards while streaming (client-side one-turn-at-a-time), then
`agent.setMessages([userMessage])` + `runAgent({}, subscriber)` — the server
owns history, only the new message's text goes over the wire.

| terminal event | handling |
|---|---|
| `RUN_FINISHED` | commit turn to `committed`; invalidate session list; analytics |
| `RUN_ERROR code:"interrupted"` (user pressed stop) | server discarded the whole turn (user message included); keep it on screen locally — the next reconnect's snapshot restores server truth |
| `RUN_ERROR code:"connection_lost"` (synthetic, socket dropped mid-run) | error state; retry re-connects via `ensureConnected` backoff |
| other `RUN_ERROR` / `onRunFailed` | error state + PostHog `WEBSOCKET_ERROR` |
| silent completion (busy rejection) | detected via a terminal-state flag after `runAgent` resolves; reset to idle |

## Analytics (PostHog)

`CHAT_SESSION_STARTED` (new-chat mount) · `MESSAGE_SENT` · `MESSAGE_RECEIVED`
(on RUN_FINISHED, with response time) · `CONVERSATION_CREATED` (first finished
turn of an `isNew` session) · `CONVERSATION_SELECTED` (sidebar click) ·
`WEBSOCKET_ERROR`.

## Future: tool approval (server-side deferred)

When `TOOL_APPROVAL_REQUEST` / `tool_decision` land, the seams are:
`AgentConnection`'s frame router (one new case), the subscriber
(`onCustomEvent` / interrupt handling + a `pendingApproval` reducer field), and
one approval card component in `AgentChatView`. The pinned SDK already ships
interrupt/resume machinery (`pendingInterrupts`, `RunAgentParameters.resume`).

## Auth seams (not yet enforced)

- WS: `buildConnectionUrl()` in `agent-connection.ts` — attach a token/cookie
  there when the server enforces auth.
- HTTP: already sends the Cognito Bearer token via `makeAuthenticatedRequest`.
