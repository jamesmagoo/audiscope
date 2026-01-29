# WebSocket Provider - Architecture Guide

## Overview

The WebSocketProvider is a centralized React Context-based solution for managing multiple WebSocket connections across the AudiScope application. It provides a unified interface for real-time communication, automatic reconnection, JWT authentication, and shared state management.

**Key Benefits:**
- Single source of truth for all WebSocket connections
- Prevents duplicate connections
- Centralized error handling
- Automatic JWT authentication
- Connection pooling by type
- Shared state across components
- Simplified component code (~85% reduction in WebSocket management code)

---

## Architecture

### Provider Hierarchy

```
app/layout.tsx:
  ThemeProvider
    └─ AuthProvider
        └─ QueryProvider
            └─ WebSocketProvider ← Centralized WebSocket management
                └─ {children}
```

**Why this position?**
- After AuthProvider: Requires JWT authentication
- After QueryProvider: Can integrate with React Query for caching
- Before children: Available to all application components

### Component Structure

```
components/providers/
└── websocket-provider.tsx (456 lines)
    ├── WebSocketProvider - React Context provider
    ├── useWebSocketContext - Access provider context
    └── useWebSocket - Convenient hook for specific connection types

lib/
└── websocket-utils.ts (346 lines)
    └── createWebSocketManager - Core WebSocket factory

hooks/
└── use-simulation-websocket.ts (238 lines)
    └── Simulation-specific hook wrapper
```

---

## Connection Types

The provider supports multiple named connection types for different use cases:

| Type | Purpose | URL Env Variable | Auto-Reconnect | Max Attempts |
|------|---------|------------------|----------------|--------------|
| **simulation** | AI voice conversation | `NEXT_PUBLIC_SIMULATION_WS_URL` | ✅ Yes | 10 |
| **notifications** | Real-time notifications | `NEXT_PUBLIC_NOTIFICATIONS_WS_URL` | ✅ Yes | 5 |
| **assessments** | Assessment progress updates | (Manual config required) | ✅ Yes | 10 |
| **generic** | Custom use cases | (Manual config required) | ✅ Yes | 10 |

---

## Usage Patterns

### Pattern 1: Simple Hook Usage (Recommended)

**For most components:**

```typescript
import { useWebSocket } from '@/components/providers/websocket-provider'

function MyComponent() {
  const {
    connect,
    disconnect,
    send,
    sendJSON,
    connectionState,
    isConnected,
    messages,
    error
  } = useWebSocket('simulation') // Connection type

  useEffect(() => {
    connect() // Connect when component mounts
    return () => disconnect() // Cleanup on unmount
  }, [])

  const handleSendMessage = () => {
    sendJSON({ type: 'message', content: 'Hello!' })
  }

  return (
    <div>
      <p>Status: {connectionState}</p>
      {isConnected && <button onClick={handleSendMessage}>Send</button>}
    </div>
  )
}
```

### Pattern 2: Auto-Connect

**Automatic connection management:**

```typescript
const { isConnected, send } = useWebSocket('notifications', true) // Auto-connect

// Connection happens automatically
// Cleanup happens automatically on unmount
```

### Pattern 3: Event Subscription

**Listen to specific WebSocket events:**

```typescript
const { subscribe } = useWebSocket('simulation')

useEffect(() => {
  // Subscribe to ai_response events
  const unsubscribe = subscribe('ai_response', (data) => {
    console.log('AI Response:', data)
  })

  // Cleanup subscription
  return unsubscribe
}, [subscribe])
```

### Pattern 4: Direct Provider Access

**For advanced use cases:**

```typescript
import { useWebSocketContext } from '@/components/providers/websocket-provider'

function AdvancedComponent() {
  const {
    connect,
    getConnectionState,
    connections // Access all active connections
  } = useWebSocketContext()

  const connectMultiple = async () => {
    await connect('simulation')
    await connect('notifications')
  }

  return <button onClick={connectMultiple}>Connect All</button>
}
```

---

## API Reference

### `useWebSocket(type, autoConnect?)`

Convenient hook for a specific connection type.

**Parameters:**
- `type: WebSocketConnectionType` - Connection type ('simulation', 'notifications', etc.)
- `autoConnect?: boolean` - Automatically connect on mount (default: false)

**Returns:**
```typescript
{
  connect: (config?: Partial<WebSocketConnectionConfig>) => Promise<void>
  disconnect: () => void
  send: (data: string | ArrayBuffer | Blob) => boolean
  sendJSON: (data: Record<string, unknown> & { type: string }) => boolean
  subscribe: (event: string, handler: (data: unknown) => void) => () => void
  connectionState: WebSocketState
  isConnected: boolean
  messages: WebSocketMessage[]
  error: string | null
}
```

### `useWebSocketContext()`

Access the full WebSocket provider context.

**Returns:**
```typescript
{
  connect: (type, config?) => Promise<void>
  disconnect: (type) => void
  disconnectAll: () => void
  send: (type, data) => boolean
  sendJSON: (type, data) => boolean
  getConnectionState: (type) => WebSocketState
  isConnected: (type) => boolean
  getMessages: (type) => WebSocketMessage[]
  getError: (type) => string | null
  subscribe: (type, event, handler) => () => void
  connections: Map<WebSocketConnectionType, ConnectionInfo>
}
```

---

## Configuration

### Environment Variables

Add WebSocket URLs to your environment files:

**`.env.dev-cloud`:**
```bash
NEXT_PUBLIC_SIMULATION_WS_URL=wss://your-api.execute-api.region.amazonaws.com/dev
NEXT_PUBLIC_NOTIFICATIONS_WS_URL=wss://your-notifications.execute-api.region.amazonaws.com/prod
```

**`.env.development`:**
```bash
NEXT_PUBLIC_SIMULATION_WS_URL=ws://localhost:5003
NEXT_PUBLIC_NOTIFICATIONS_WS_URL=ws://localhost:5004
```

### Custom Configuration

Override default settings per connection:

```typescript
await connect('simulation', {
  url: 'wss://custom-endpoint.com',
  reconnect: true,
  maxReconnectAttempts: 5,
  debug: true,
  options: {
    sessionId: 'abc123',
    scenario: 'emergency-response'
  }
})
```

---

## Message Protocol

### Client → Server

**JSON Messages:**
```typescript
// Must include 'type' property
sendJSON({
  type: 'message_type',
  data: 'payload',
  timestamp: Date.now()
})
```

**Binary Messages:**
```typescript
// Audio chunks, files, etc.
const arrayBuffer = await audioBlob.arrayBuffer()
send(arrayBuffer)
```

### Server → Client

**Event-Based Routing:**

Messages from server are automatically routed to event handlers based on `type` property:

```typescript
// Server sends: { type: 'ai_response', content: '...' }

// Client receives via subscription:
subscribe('ai_response', (data) => {
  console.log('AI Response:', data.content)
})
```

**Special Events:**
- `stateChange` - Connection state changes
- `connected` - Successfully connected
- `disconnected` - Connection closed
- `error` - WebSocket error occurred
- `connectionError` - Failed to establish connection
- `reconnecting` - Attempting reconnection
- `maxReconnectAttemptsReached` - Giving up on reconnection

---

## Connection Lifecycle

```
Component Mount
    ↓
Call connect()
    ↓
Provider checks if connection exists
    ↓
[New Connection]              [Existing Connection]
    ↓                               ↓
Create WebSocketManager      Return existing connection
    ↓
Fetch JWT token
    ↓
Establish WebSocket
    ↓
State: connecting
    ↓
WebSocket opens
    ↓
State: authenticating
Send first message: { type: 'auth', token: '...' }
Set 5 second auth timeout
    ↓
[Auth Success]              [Auth Failure/Timeout]
    ↓                            ↓
State: connected         State: error
Process message queue    Close connection
Setup event handlers     Schedule reconnect
    ↓
Ready for communication
    ↓
Component Unmount
    ↓
Call disconnect()
    ↓
Close WebSocket
Remove from registry
```

---

## Reconnection Strategy

### Exponential Backoff

```
Attempt 1:  1 second delay
Attempt 2:  2 seconds delay
Attempt 3:  4 seconds delay
Attempt 4:  8 seconds delay
Attempt 5:  16 seconds delay
Attempt 6+: 30 seconds delay (capped)
```

### Configuration

```typescript
{
  reconnect: true,              // Enable auto-reconnect
  maxReconnectAttempts: 10,     // Max attempts before giving up
  maxReconnectDelay: 30000      // Cap delay at 30 seconds
}
```

### Monitoring Reconnection

```typescript
subscribe('reconnecting', ({ attempt, delay }) => {
  console.log(`Reconnecting attempt ${attempt} in ${delay}ms`)
})

subscribe('maxReconnectAttemptsReached', (attempts) => {
  console.error(`Failed to reconnect after ${attempts} attempts`)
  // Show user notification to refresh page
})
```

---

## Error Handling

### Component-Level Errors

```typescript
const { error, connectionState } = useWebSocket('simulation')

if (error) {
  return <Alert variant="destructive">{error}</Alert>
}

if (connectionState === 'error') {
  return <Button onClick={() => connect()}>Retry Connection</Button>
}
```

### Provider-Level Errors

Errors are automatically logged and stored per connection type. Access via:

```typescript
const { getError } = useWebSocketContext()

const simulationError = getError('simulation')
const notificationsError = getError('notifications')
```

### Global Error Handling

```typescript
useEffect(() => {
  const unsubscribe = subscribe('error', (error) => {
    // Log to error tracking service (e.g., Sentry)
    console.error('WebSocket error:', error)
  })

  return unsubscribe
}, [subscribe])
```

---

## Authentication

### First Message Authentication

The provider uses a **first message authentication** pattern where the JWT token is sent as the first WebSocket message after the connection opens, rather than in the URL.

**Why First Message Auth?**
- ✅ Token not exposed in URL/browser history
- ✅ Standards-compliant (no custom headers needed)
- ✅ Cleaner separation of concerns
- ✅ Backend can implement rate limiting before auth
- ✅ Better error handling with typed auth responses

### Frontend Flow

The provider automatically integrates with `lib/api-utils.ts` for JWT authentication:

```typescript
import { getAuthHeaders } from './api-utils'

// 1. Fetch JWT token during connect()
const authHeaders = await getAuthHeaders()
const token = authHeaders.Authorization?.replace('Bearer ', '')

// 2. Establish WebSocket WITHOUT token in URL
ws = new WebSocket(url) // Clean URL, no query parameters

// 3. When connection opens, send auth as first message
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: token
  }))

  // Set 5 second timeout for auth response
  setTimeout(() => {
    if (state === 'authenticating') {
      ws.close(4002, 'Authentication timeout')
    }
  }, 5000)
}

// 4. Handle auth response
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'auth_success') {
    // Store session info and transition to connected
    sessionInfo = {
      sessionId: message.session_id,
      userId: message.user_id,
      timestamp: message.timestamp
    }
    setState('connected')
    processMessageQueue() // Now safe to send queued messages
  }

  if (message.type === 'auth_error') {
    setState('error')
    ws.close(4001, 'Authentication failed')
  }
}
```

### Backend Implementation

Your WebSocket server should expect auth as the first message:

```typescript
// Backend (Node.js/Go example)
wss.on('connection', (ws) => {
  let authenticated = false

  // Set timeout for auth
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.close(4002, 'Authentication timeout')
    }
  }, 5000)

  ws.on('message', (data) => {
    const message = JSON.parse(data)

    // First message must be auth
    if (!authenticated) {
      if (message.type === 'auth') {
        try {
          const decoded = jwt.verify(message.token, JWT_SECRET)
          clearTimeout(authTimeout)
          authenticated = true

          // Send success response
          ws.send(JSON.stringify({
            type: 'auth_success',
            session_id: generateSessionId(),
            user_id: decoded.sub,
            timestamp: new Date().toISOString()
          }))
        } catch (err) {
          ws.send(JSON.stringify({
            type: 'auth_error',
            error: 'Invalid token'
          }))
          ws.close(4001, 'Authentication failed')
        }
      } else {
        // Reject non-auth messages before authentication
        ws.close(4001, 'Authentication required')
      }
      return
    }

    // Handle normal messages after auth...
  })
})
```

### Auth State Machine

```
disconnected → connecting → authenticating → connected
                    ↓              ↓
                  error ← ─ ─ ─ ─ ┘
                          (timeout/failure)
```

**States:**
- `connecting`: WebSocket connection being established
- `authenticating`: Auth message sent, waiting for response (5s timeout)
- `connected`: Auth successful, ready to send/receive messages
- `error`: Auth failed, timeout, or connection error

### Session Info

After successful authentication, session information is stored:

```typescript
const { getSessionInfo } = useWebSocket('simulation')

const sessionInfo = getSessionInfo()
// {
//   sessionId: 'sess_abc123',
//   userId: 'user_xyz789',
//   timestamp: '2026-01-28T10:00:00Z'
// }
```

### Message Queuing During Auth

Messages sent before authentication completes are automatically queued:

```typescript
connect() // Initiates connection

// These messages are queued until auth succeeds
sendJSON({ type: 'message1' })
sendJSON({ type: 'message2' })

// After auth success, queue is processed automatically
// Server receives: auth → message1 → message2
```

**Queue Behavior:**
- Max queue size: 100 messages
- Messages blocked during `authenticating` state
- Queue processed after `auth_success` response
- Queue cleared if auth fails

### Auth Error Handling

```typescript
useEffect(() => {
  // Subscribe to auth-specific errors
  const unsubAuthError = subscribe('authenticationError', (error) => {
    console.error('Auth failed:', error)
    toast.error('Authentication failed. Please log in again.')
  })

  const unsubAuthTimeout = subscribe('authenticationTimeout', () => {
    console.error('Auth timeout')
    toast.error('Connection timeout. Please try again.')
  })

  return () => {
    unsubAuthError()
    unsubAuthTimeout()
  }
}, [subscribe])
```

### WebSocket Close Codes

The provider uses standard close codes for auth failures:

| Code | Meaning | Description |
|------|---------|-------------|
| `4001` | Authentication Failed | Invalid token or auth message rejected |
| `4002` | Authentication Timeout | No auth response within 5 seconds |
| `1000` | Normal Closure | Client disconnect |

---

## Real-World Examples

### Example 1: Simulation Feature

**See:** `hooks/use-simulation-websocket.ts`

Wraps the provider with simulation-specific logic:

```typescript
export function useSimulationWebSocket(options) {
  const {
    connect: connectWS,
    disconnect: disconnectWS,
    send,
    subscribe,
    connectionState,
    isConnected,
    error: wsError
  } = useWebSocket('simulation', options.autoConnect)

  // Simulation-specific state
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(options.sessionId)

  // Subscribe to AI responses
  useEffect(() => {
    const unsubscribe = subscribe('ai_response', (data) => {
      setMessages(prev => [...prev, transformAIResponse(data)])
    })
    return unsubscribe
  }, [subscribe])

  // Custom send audio chunk function
  const sendAudioChunk = async (audioBlob) => {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const metadata = { type: 'audio_chunk', sessionId, ... }

    send(JSON.stringify(metadata))
    return send(arrayBuffer)
  }

  return { sendAudioChunk, messages, connectionState, ... }
}
```

### Example 2: Notifications (Future)

```typescript
export function useNotifications() {
  const { subscribe } = useWebSocket('notifications', true) // Auto-connect
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const unsubscribe = subscribe('notification', (data) => {
      const notification = {
        id: data.id,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp
      }

      setNotifications(prev => [notification, ...prev])

      // Show toast notification
      toast.info(notification.title, { description: notification.message })
    })

    return unsubscribe
  }, [subscribe])

  return { notifications }
}
```

---

## Best Practices

### 1. Use Appropriate Connection Type

```typescript
// ✅ Good: Dedicated connection types
useWebSocket('simulation')    // For AI conversation
useWebSocket('notifications') // For real-time notifications

// ❌ Bad: Generic type for everything
useWebSocket('generic')
```

### 2. Clean Up Subscriptions

```typescript
// ✅ Good: Always return unsubscribe
useEffect(() => {
  const unsubscribe = subscribe('event', handler)
  return unsubscribe
}, [subscribe])

// ❌ Bad: Memory leak
useEffect(() => {
  subscribe('event', handler)
}, [subscribe])
```

### 3. Handle Connection Errors

```typescript
// ✅ Good: Show user-friendly error
const { error, connect } = useWebSocket('simulation')

if (error) {
  return (
    <Alert>
      <p>{error}</p>
      <Button onClick={() => connect()}>Retry</Button>
    </Alert>
  )
}

// ❌ Bad: Silent failure
const { error } = useWebSocket('simulation')
// No error handling
```

### 4. Optimize Re-renders

```typescript
// ✅ Good: Only subscribe to what you need
const { isConnected, send } = useWebSocket('simulation')

// ❌ Bad: Unnecessary re-renders
const everything = useWebSocket('simulation')
```

### 5. Debug Mode in Development

```typescript
// ✅ Good: Enable debug logs in development
<WebSocketProvider debug={process.env.NODE_ENV === 'development'}>
  {children}
</WebSocketProvider>

// Logs connection events, message sending, errors, etc.
```

---

## Testing

### Unit Testing

```typescript
import { renderHook } from '@testing-library/react'
import { WebSocketProvider, useWebSocket } from '@/components/providers/websocket-provider'

describe('useWebSocket', () => {
  it('connects and disconnects', async () => {
    const wrapper = ({ children }) => (
      <WebSocketProvider>{children}</WebSocketProvider>
    )

    const { result } = renderHook(() => useWebSocket('simulation'), { wrapper })

    await result.current.connect()
    expect(result.current.connectionState).toBe('connected')

    result.current.disconnect()
    expect(result.current.connectionState).toBe('disconnected')
  })
})
```

### Integration Testing

```typescript
// Mock WebSocket in tests
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.()
    }, 100)
  }

  send(data) {
    // Simulate server response
    setTimeout(() => {
      this.onmessage?.({ data: JSON.stringify({ type: 'response' }) })
    }, 50)
  }

  close() {
    this.readyState = WebSocket.CLOSED
    this.onclose?.()
  }
}
```

---

## Troubleshooting

### Connection Fails Immediately

**Symptom:** `connectionState` goes straight to 'error'

**Causes:**
1. WebSocket URL not configured
2. JWT token invalid or expired
3. CORS issues (check browser console)
4. Backend WebSocket server not running

**Debug:**
```typescript
const { error, connectionState } = useWebSocket('simulation')

console.log('State:', connectionState)
console.log('Error:', error)

// Enable debug mode:
<WebSocketProvider debug={true}>
```

### Messages Not Received

**Symptom:** `subscribe()` handler never called

**Causes:**
1. Server not sending `type` property in messages
2. Event name mismatch
3. Subscription after message received

**Debug:**
```typescript
// Subscribe to all messages:
subscribe('message', (data) => {
  console.log('Raw message:', data)
})
```

### Multiple Connections Created

**Symptom:** Multiple WebSocket connections for same type

**Causes:**
1. Calling `connect()` multiple times
2. Component re-mounting
3. Not using provider correctly

**Fix:**
```typescript
// ✅ Check before connecting
if (!isConnected) {
  await connect()
}

// ✅ Or let provider handle it (checks internally)
await connect() // Safe to call multiple times
```

---

## Performance Considerations

### Connection Pooling

The provider maintains a singleton connection per type:

```typescript
// These both use the SAME WebSocket connection:
useWebSocket('simulation') // Component A
useWebSocket('simulation') // Component B
```

**Benefits:**
- No duplicate connections
- Shared state
- Reduced server load
- Lower latency

### Message Queue

When disconnected, messages are queued (up to 100):

```typescript
// Connection lost
send('message 1') // Queued
send('message 2') // Queued

// Connection restored
// → message 1 sent
// → message 2 sent
```

### Memory Management

The provider automatically cleans up on unmount:

```typescript
useEffect(() => {
  return () => {
    // Automatic cleanup:
    // - Close all WebSocket connections
    // - Remove event listeners
    // - Clear message queues
  }
}, [])
```

---

## Migration Guide

### From Direct WebSocket Usage

**Before:**
```typescript
const [ws, setWs] = useState(null)

useEffect(() => {
  const socket = new WebSocket(url)
  socket.onopen = () => console.log('Connected')
  socket.onmessage = (event) => handleMessage(event.data)
  setWs(socket)

  return () => socket.close()
}, [])
```

**After:**
```typescript
const { connect, subscribe } = useWebSocket('simulation')

useEffect(() => {
  connect()
  return () => disconnect()
}, [])

useEffect(() => {
  return subscribe('message', (data) => handleMessage(data))
}, [subscribe])
```

### From Component-Scoped Managers

**Before:** (180 lines in component)
```typescript
const wsManagerRef = useRef(null)
const [connectionState, setConnectionState] = useState('disconnected')
// ... lots of manual management
```

**After:** (20 lines in component)
```typescript
const { connectionState, send } = useWebSocket('simulation')
// Provider handles everything
```

---

## Future Enhancements

Potential improvements to the WebSocketProvider:

1. **Message Persistence:** Store messages in IndexedDB
2. **Offline Queue:** Queue messages when offline, send when online
3. **Connection Analytics:** Track connection quality, latency
4. **Rate Limiting:** Prevent message flooding
5. **Compression:** Automatic message compression
6. **Binary Protocol:** Support Protocol Buffers or MessagePack
7. **Multi-Tenancy:** Support tenant-specific connections

---

**Last Updated:** January 28, 2026
**Version:** 1.0.0
**Status:** Production Ready
