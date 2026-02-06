# WebSocket Architecture - Simple Approach

AudiScope uses a simple, direct WebSocket hook for real-time connections. **No provider complexity** - just a single hook that does exactly what's needed.

## Architecture

**Files:**
- `hooks/use-simple-websocket.ts` - Simple WebSocket hook (~230 lines)
- Core-API Integration: `docs/core-api-websocket-spec.md`

**Benefits:**
- ✅ Simple and direct - no magic
- ✅ Easy to debug - all logic in one place
- ✅ No provider overhead
- ✅ Guaranteed single connection
- ✅ React StrictMode safe

## Key Features

- **WebSocket stored in ref** - Never recreates on re-render
- **Automatic JWT authentication** - Sends token as first message
- **Event subscription system** - Subscribe to message types
- **Exponential backoff reconnection** - 1s → 2s → 4s → 8s → 16s → 30s (capped)
- **Connection states**: `disconnected` | `connecting` | `connected` | `error`
- **Simple error handling** - Single error state, no complexity

## Usage - Simulation Feature

**In component (voice-recorder.tsx):**
```typescript
import { useSimpleWebSocket } from '@/hooks/use-simple-websocket'

// Build WebSocket URL
const baseUrl = process.env.NEXT_PUBLIC_SIMULATION_WS_URL || 'ws://localhost:5002/api/v1/simulations'
const sessionId = useRef(`sim-${Date.now()}`).current
const wsUrl = `${baseUrl}/${sessionId}/stream`

// Use the hook
const {
  send,
  isConnected,
  connectionState,
  error,
  subscribe
} = useSimpleWebSocket({
  url: wsUrl,
  debug: true,
  reconnect: true,
  maxReconnectAttempts: 10
})

// Subscribe to server messages
useEffect(() => {
  const unsubscribe = subscribe('audio_processed', (data) => {
    console.log('Turn saved:', data.payload)
    setRecordingState('idle')
  })

  return unsubscribe
}, [subscribe])

// Send messages
send(JSON.stringify({ type: 'audio_chunk', payload: { ... } }))
```

**Connection lifecycle:**
- Hook connects automatically on mount
- Disconnects automatically on unmount
- Single connection guaranteed (stored in ref)
- React StrictMode safe (guard prevents duplicates)

## Core-API Message Protocol

**Full specification**: See `docs/core-api-websocket-spec.md`

**Authentication (First Message):**
```json
// Client → Server
{
  "type": "auth",
  "token": "eyJhbGciOi..."
}

// Server → Client (Success)
{
  "type": "auth_success",
  "session_id": "abc123-456-789",
  "user_id": "user-uuid",
  "timestamp": "2025-01-30T10:30:00Z"
}
```

**Audio Streaming:**
```json
// Client → Server (Audio Chunk)
{
  "type": "audio_chunk",
  "payload": {
    "chunk": "base64-encoded-audio...",
    "sequence": 1,
    "format": "webm"
  }
}

// Client → Server (Recording Complete)
{
  "type": "audio_complete"
}

// Server → Client (Processed)
{
  "type": "audio_processed",
  "payload": {
    "turn_number": 1,
    "audio_url": "organisations/.../turn-1.webm",
    "status": "audio_saved"
  }
}
```

**Event Subscription:**
```typescript
subscribe('audio_processed', (data) => {
  console.log(`Turn ${data.payload.turn_number} saved`)
})
```

## Connection Lifecycle

1. Component mounts → Hook initializes
2. WebSocket stored in ref (never recreates)
3. Fetch JWT token from AWS Amplify
4. Establish WebSocket connection
5. WebSocket opens → State: `connecting`
6. Send first message: `{ type: 'auth', token: '...' }`
7. Receive auth response: `{ type: 'auth_success', ... }`
8. State: `connected`
9. Ready to send/receive messages
10. Component unmounts → Disconnect and cleanup

## Error Handling

**Simple error state:**
```typescript
const { error, connectionState } = useSimpleWebSocket({ url })

if (error) {
  return <Alert variant="destructive">{error}</Alert>
}

if (connectionState === 'error') {
  toast.error('Connection failed')
}
```

**Subscribe to specific errors:**
```typescript
subscribe('error', (data) => {
  console.error('Server error:', data.payload.error)
})
```

## Documentation

See:
- **Simulation Setup**: `docs/simulation-setup.md` - Implementation details
- **Core-API Spec**: `docs/core-api-websocket-spec.md` - Message protocol
