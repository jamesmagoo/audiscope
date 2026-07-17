# Agent server — contract additions (sessions & history)

What the web client needs from the agent server **in addition to** the existing
`/ws/agent` WebSocket (AG-UI) endpoint: one new WS event on connect
(history snapshot), and two plain HTTP+JSON endpoints for the conversations
sidebar (list + delete).

---

## WS addition: `MESSAGES_SNAPSHOT` on connect

Immediately after `SESSION_RESOLVED`, and before any `RUN_*` events, the server
sends the session's full persisted history as a standard
[AG-UI `MESSAGES_SNAPSHOT`](https://docs.ag-ui.com/concepts/events) event:

```jsonc
{
  "type": "MESSAGES_SNAPSHOT",
  "messages": [
    { "id": "m1", "role": "user",      "content": "hello", "createdAt": "2026-07-17T10:12:03Z" },
    { "id": "m2", "role": "assistant", "content": "Hi! …", "createdAt": "2026-07-17T10:12:09Z" }
  ]
}
```

- Sent exactly **once per connection**, right after `SESSION_RESOLVED`.
- An empty/new session sends `"messages": []` (still send the event — the
  client uses it as the "history is ready" signal).
- `messages` ascending by time; `role` is `"user" | "assistant"` only.
- `createdAt` (ISO 8601 UTC) is an extra field on each message beyond the AG-UI
  base shape — the UI displays per-message timestamps. Include it.

This makes the socket the single source of truth for a session's messages: the
client renders snapshot + everything streamed since, and a reconnect naturally
resyncs (which is also what makes discard-all cancel semantics free — see
below). **The client does not use a messages HTTP endpoint.**

**Hosting**: same FastAPI host as `/ws/agent`. The frontend uses one base URL
for both (`NEXT_PUBLIC_AGENT_API_URL` / `NEXT_PUBLIC_AGENT_WS_URL`). The
browser calls these endpoints **directly** (Next.js rewrites can't proxy
WebSockets, so there is no proxy in the path for either transport) — CORS is
therefore required, see below.

---

## Endpoints

### 1. List sessions

```
GET /api/agent/sessions?limit=50&offset=0
```

```jsonc
// 200
{
  "sessions": [
    {
      "id": "f6cc…10f2",
      "title": "How do I interpret the EVeNTS score…",
      "created_at": "2026-07-17T10:12:03Z",
      "updated_at": "2026-07-17T10:14:41Z",
      "message_count": 6,
      "preview": "How do I interpret the EVeNTS score for a case where…"  // nullable
    }
  ]
}
```

- Sorted by `updated_at` **descending**.
- `limit` default 50, `offset` default 0. The client fetches one page for now.
- **Exclude sessions with zero messages.** Connecting to `/ws/agent` without a
  `session_id` mints a session before the user sends anything; abandoned empty
  sessions must not appear in the list.
- `preview`: first ~100 characters of the first user message, or `null`.

### 2. Get session messages — **not used by the client**

History arrives over the WS via `MESSAGES_SNAPSHOT` (see above). If a
`GET /api/agent/sessions/{id}/messages` endpoint already exists it can stay for
debugging/tooling, but the web client never calls it and it is not part of this
contract.

### 3. Delete session

```
DELETE /api/agent/sessions/{id}
```

- `204` on success (also for an already-deleted id — idempotent is fine).
- If a live WebSocket is bound to this session, the server should close it;
  the client treats that close as normal.

### 4. Rename session (optional — phase 2, not blocking)

```
PATCH /api/agent/sessions/{id}
{ "title": "New title" }
```

→ `200` with the updated session object. The UI does not need this at launch.

---

## Semantics to pin down

- **Titles** are server-derived from the first user message (truncate to ~60
  chars). Until the first turn completes a session may have a placeholder
  title; since empty sessions are excluded from listing, this shouldn't
  surface.
- **Cancelled turns persist NOTHING** (server decision, confirmed): neither the
  partial assistant reply nor the user message that started the turn is saved.
  Cancel is a full "undo" — the session's server-side history after a cancel is
  exactly what it was before the turn started. A session whose only activity
  was cancelled has zero messages and therefore never appears in the list. The
  client keeps the cancelled turn visible locally until the next reconnect,
  whose `MESSAGES_SNAPSHOT` restores server truth — no special client logic.
- **Timestamps**: ISO 8601 UTC strings (`…Z`) everywhere in these HTTP
  responses. (Separately, AG-UI `timestamp` on WS events should stay a number,
  epoch ms, per the AG-UI spec.)
- **Errors**: JSON `{ "error": "message" }` with an appropriate status code.
- **WS `session_id` resolution** (server decision, confirmed): a supplied
  `session_id` is honored **verbatim** — the server never replaces it, and
  returns `SESSION_RESOLVED { sessionId: <same>, isNew: false }` whether or not
  the session has a DB row yet (a session only gets a row when its first turn
  is persisted, so "unknown" and "known-but-empty" are indistinguishable and
  both valid). Only a connect with **no** `session_id` mints a fresh id
  (`isNew: true`). Consequences for the client: `isNew: false` does not
  guarantee history exists — the connection's `MESSAGES_SNAPSHOT` is what says
  (it's `[]` for an empty session); a resolved id may legitimately not appear
  in the session list yet (empty sessions never list).

---

## CORS

Browser origins call these endpoints (and the WS) directly:

- Allowed origins: `http://localhost:3000` plus the deployed web app domains
  (staging + production).
- Methods: `GET, DELETE, PATCH, OPTIONS`.
- Allowed request headers: `Authorization, Content-Type, X-Client-Platform,
  X-Client-Version`.
- Preflight (`OPTIONS`) support is required because the client sends an
  `Authorization` header.

## Auth

Auth is not enforced yet, but the client already sends
`Authorization: Bearer <Cognito access token>` on every HTTP call (same headers
it sends to the Core API). The server should **tolerate the header now** and
enforce it later; when auth lands, sessions become per-user. Until then,
sessions are effectively global — known limitation.
