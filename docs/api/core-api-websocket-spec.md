# Core-API WebSocket Specification

## Overview

This document describes the WebSocket API for simulation audio streaming integration with the core-API backend.

**Endpoint**: `ws://localhost:5002/api/v1/simulations/:id/stream`
**Current Phase**: Phase 1 (Audio Storage) - Implemented
**Next Phase**: Phase 2 (STT + AI Integration) - Planned

---

## Connection Flow

### Step 1: Create Session via REST API

**Endpoint**: `POST /api/v1/simulations`

**Headers**:
```json
{
  "Authorization": "Bearer <your-jwt-token>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "product_id": "uuid-of-product",  // Optional - omit for general training
  "simulation_type": "objection_handling",
  "scenario_prompt": "Customer is concerned about price"
}
```

**Request Body (without product)**:
```json
{
  "simulation_type": "scenario_based",
  "scenario_prompt": "General medical scenario training"
}
```

**Valid `simulation_type` values**:
- `"feature_demo"` - Product feature demonstration
- `"objection_handling"` - Handling customer objections
- `"scenario_based"` - Custom scenario-based training

**Fields**:
- `product_id` (optional) - UUID of product to train on. Omit for general training.
- `simulation_type` (required) - Type of simulation
- `scenario_prompt` (required) - Description of the training scenario

**Response (200 OK) - with product**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_id": "uuid-of-product",
  "simulation_type": "objection_handling",
  "scenario_prompt": "Customer is concerned about price",
  "status": "in_progress",
  "started_at": "2025-01-30T10:30:00Z"
}
```

**Response (200 OK) - without product**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "simulation_type": "scenario_based",
  "scenario_prompt": "General medical scenario training",
  "status": "in_progress",
  "started_at": "2025-01-30T10:30:00Z"
}
```

**Note**: `product_id` is only present in response if it was provided in request.

### Step 2: Extract `session_id`

Extract the `session_id` field from the response - this is what you need for the WebSocket connection.

### Step 3: Open WebSocket Connection

Use the `session_id` to build the WebSocket URL: `ws://host/api/v1/simulations/{session_id}/stream`

### Step 4: Send Authentication Message

Client sends authentication message as first message (within 5 seconds)

### Step 5: Server Validates Token

Server validates JWT token and responds with `auth_success`

### Step 6: Start Audio Streaming

Client can now send audio chunks and other messages

**Important**: The `session_id` MUST be obtained from the REST API response. Do not generate client-side IDs.

---

## Authentication

### Authentication Message (First Message)

**Client sends:**
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Required:**
- Must be the first message sent after connection
- Must be sent within **5 seconds** of connection
- `token`: JWT access token (same token used for REST API calls)

### Authentication Success Response

**Server responds:**
```json
{
  "type": "auth_success",
  "session_id": "abc123-456-789",
  "user_id": "user-uuid",
  "timestamp": "2025-01-30T10:30:00Z"
}
```

### Authentication Error Response

**Server responds:**
```json
{
  "type": "error",
  "payload": {
    "error": "invalid token",
    "code": "auth_failed"
  },
  "timestamp": "2025-01-30T10:30:00Z"
}
```

**Connection closes immediately after auth error.**

---

## Message Types

### 1. `ping` - Client Heartbeat

**Client sends:**
```json
{
  "type": "ping"
}
```

**Server responds:**
```json
{
  "type": "pong",
  "session_id": "abc123-456-789",
  "timestamp": "2025-01-30T10:30:00Z"
}
```

### 2. `audio_chunk` - Stream Audio Data

**Client sends:**
```json
{
  "type": "audio_chunk",
  "payload": {
    "chunk": "base64-encoded-audio-data...",
    "sequence": 1,
    "format": "webm"
  }
}
```

**Payload fields:**
- `chunk` (required): Base64-encoded audio data
- `sequence` (required): Chunk sequence number (starting from 1)
- `format` (required): Audio format - one of: `webm`, `mp3`, `wav`, `ogg`, `m4a`

**Backend Processing Note:**
The server should accept all formats and transcode to OGG/Opus for AI processing. Safari users will send `m4a` format. See `docs/audio-transcoding-requirements.md` for implementation details.

**Constraints:**
- Max message size: **512KB** (including base64 encoding overhead ~33%)
- Recommended chunk size: 10-50KB (before encoding)

### 3. `audio_complete` - Finish Audio Turn

**Client sends:**
```json
{
  "type": "audio_complete"
}
```

#### ⚠️ CRITICAL: Message Ordering Requirement

The client **MUST** ensure all `audio_chunk` messages have been fully processed and sent **BEFORE** sending `audio_complete`.

**Incorrect (broken) implementation:**

```javascript
// ❌ DON'T DO THIS
mediaRecorder.stop();
socket.send({ type: 'audio_complete' }); // Too early! Final chunk still processing
```

**Correct implementation:**

```javascript
// ✅ DO THIS
let pendingChunk = null;

mediaRecorder.ondataavailable = (event) => {
  pendingChunk = processAndSendChunk(event.data); // Returns Promise
};

mediaRecorder.onstop = async () => {
  // Wait for final chunk to finish processing
  if (pendingChunk) {
    await pendingChunk;
  }

  // NOW it's safe to send audio_complete
  socket.send({ type: 'audio_complete' });
};
```

**Why this matters:**

- WebM/OGG containers require proper finalization
- MediaRecorder fires `onstop` before final `ondataavailable` completes
- Async operations (Blob→ArrayBuffer→base64) take time
- Server must receive all chunks before starting file assembly

**Server responds:**

```json
{
  "type": "audio_processed",
  "session_id": "abc123-456-789",
  "payload": {
    "turn_number": 1,
    "audio_url": "organisations/org-id/simulations/session-id/turn-1.webm",
    "status": "audio_saved"
  },
  "timestamp": "2025-01-30T10:30:15Z"
}
```

### 4. `audio_processed` - Server Confirmation

**Server sends:**
```json
{
  "type": "audio_processed",
  "session_id": "abc123-456-789",
  "payload": {
    "turn_number": 1,
    "audio_url": "organisations/org-id/simulations/session-id/turn-1.webm",
    "status": "audio_saved"
  },
  "timestamp": "2025-01-30T10:30:15Z"
}
```

### 5. `error` - Error Message

**Server sends:**
```json
{
  "type": "error",
  "session_id": "abc123-456-789",
  "payload": {
    "error": "error message here"
  },
  "timestamp": "2025-01-30T10:30:15Z"
}
```

**Common errors:**
- `"invalid audio chunk format: missing 'chunk' field"`
- `"failed to decode audio chunk"`
- `"no audio data buffered"` - Called `audio_complete` without sending chunks
- `"failed to process audio: <reason>"` - Processing error
- `"unknown message type: <type>"` - Invalid message type

---

## Frontend Integration

### 1. Create Simulation Session (REST API)

**First, create a session via REST API to get server-generated session ID:**

```typescript
import { createSimulationSession } from '@/lib/simulation-api.service'

// Option 1: Create session WITH product
const response = await createSimulationSession({
  product_id: 'uuid-of-product',
  simulation_type: 'objection_handling', // or 'feature_demo' | 'scenario_based'
  scenario_prompt: 'Customer is concerned about price',
})

// Option 2: Create session WITHOUT product (omit product_id)
const response = await createSimulationSession({
  simulation_type: 'scenario_based',
  scenario_prompt: 'General medical scenario training',
})

// Server returns UUID v4 session_id
const sessionId = response.session_id
console.log('Session created:', sessionId) // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

**Session Creation Request (with product):**
```
POST /api/v1/simulations
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "product_id": "uuid-of-product",
  "simulation_type": "objection_handling",
  "scenario_prompt": "Customer is concerned about price"
}
```

**Session Creation Request (without product):**
```
POST /api/v1/simulations
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "simulation_type": "scenario_based",
  "scenario_prompt": "General medical scenario training"
}
```

**Valid `simulation_type` values:**
- `"feature_demo"` - Product feature demonstration
- `"objection_handling"` - Handling customer objections
- `"scenario_based"` - Custom scenario-based training

**Note**: `product_id` is optional. Omit it for general training scenarios.

**Session Creation Response (with product):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_id": "uuid-of-product",
  "simulation_type": "objection_handling",
  "scenario_prompt": "Customer is concerned about price",
  "status": "in_progress",
  "started_at": "2025-01-30T10:30:00Z"
}
```

**Session Creation Response (without product):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "simulation_type": "scenario_based",
  "scenario_prompt": "General medical scenario training",
  "status": "in_progress",
  "started_at": "2025-01-30T10:30:00Z"
}
```

### 2. Open WebSocket Connection

**Use the session_id from Step 1 to build WebSocket URL:**

```typescript
const baseUrl = process.env.NEXT_PUBLIC_SIMULATION_WS_URL || 'ws://localhost:5002/api/v1/simulations'
const wsUrl = `${baseUrl}/${sessionId}/stream`

const { send, isConnected, subscribe } = useSimpleWebSocket({
  url: wsUrl,
  debug: true,
  reconnect: true,
  maxReconnectAttempts: 10
})
```

### 3. Handle Authentication

```typescript
// Hook automatically sends auth as first message
// Subscribe to auth_success
useEffect(() => {
  const unsubscribe = subscribe('auth_success', (data) => {
    console.log('Authenticated:', data)
  })
  return unsubscribe
}, [subscribe])
```

### 4. Stream Audio Chunks

```typescript
mediaRecorder.ondataavailable = async (event) => {
  if (event.data.size > 0 && isConnected) {
    // Convert to base64
    const arrayBuffer = await event.data.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const base64Chunk = btoa(String.fromCharCode(...uint8Array))

    // Send in core-API format
    send(JSON.stringify({
      type: 'audio_chunk',
      payload: {
        chunk: base64Chunk,
        sequence: sequence++,
        format: 'webm'
      }
    }))
  }
}
```

### 5. Signal Completion

```typescript
mediaRecorder.onstop = () => {
  if (isConnected) {
    send(JSON.stringify({ type: 'audio_complete' }))
  }
}
```

### 6. Handle Server Response

```typescript
useEffect(() => {
  const unsubscribe = subscribe('audio_processed', (data) => {
    const message = data as { payload: { turn_number, audio_url, status } }
    console.log(`Turn ${message.payload.turn_number} saved: ${message.payload.status}`)

    // Ready for next turn
    setRecordingState('idle')
    sequenceRef.current = 0
  })

  return unsubscribe
}, [subscribe])
```

---

## Complete Flow Example

Here's the complete sequence from session creation to audio streaming:

```typescript
import { createSimulationSession } from '@/lib/simulation-api.service'
import { useSimpleWebSocket } from '@/hooks/use-simple-websocket'

function VoiceRecorder() {
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Step 1: Create session on mount
  useEffect(() => {
    async function initSession() {
      // With product
      const response = await createSimulationSession({
        product_id: 'uuid-of-product',
        simulation_type: 'objection_handling',
        scenario_prompt: 'Customer is concerned about price',
      })

      // OR without product (omit product_id field)
      // const response = await createSimulationSession({
      //   simulation_type: 'scenario_based',
      //   scenario_prompt: 'General medical scenario training',
      // })

      setSessionId(response.session_id) // UUID from server
      console.log('Status:', response.status) // "in_progress"
    }

    initSession()
  }, [])

  // Step 2: WebSocket connects once sessionId is available
  const baseUrl = process.env.NEXT_PUBLIC_SIMULATION_WS_URL
  const wsUrl = sessionId ? `${baseUrl}/${sessionId}/stream` : null

  const { send, isConnected, subscribe } = useSimpleWebSocket({
    url: wsUrl || '',
    debug: true,
  })

  // Step 3: Subscribe to responses
  useEffect(() => {
    const unsubAuth = subscribe('auth_success', (data) => {
      console.log('Authenticated:', data)
    })

    const unsubAudio = subscribe('audio_processed', (data) => {
      console.log('Turn saved:', data.payload)
    })

    return () => {
      unsubAuth()
      unsubAudio()
    }
  }, [subscribe])

  // Step 4: Stream audio
  const startRecording = () => {
    mediaRecorder.ondataavailable = async (event) => {
      const arrayBuffer = await event.data.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      send(JSON.stringify({
        type: 'audio_chunk',
        payload: { chunk: base64, sequence: seq++, format: 'webm' }
      }))
    }

    mediaRecorder.start(100) // Collect every 100ms
  }

  // Step 5: Signal completion
  const stopRecording = () => {
    mediaRecorder.stop()
    mediaRecorder.onstop = () => {
      send(JSON.stringify({ type: 'audio_complete' }))
    }
  }
}
```

**Key Points:**
- ✅ Session ID comes from REST API (server-generated UUID)
- ✅ WebSocket URL includes session ID in path
- ✅ WebSocket connection waits until session ID is available
- ✅ Authentication happens automatically on connection
- ✅ Audio chunks sent as base64-encoded JSON messages
- ✅ `audio_complete` signals end of turn
- ✅ Server responds with `audio_processed` confirmation

---

## Technical Constraints

### Message Sizes
- **Max message size**: 512KB (including JSON structure and base64 encoding)
- **Recommended audio chunk size**: 10-50KB (before base64 encoding)
- Base64 encoding adds ~33% overhead

### Timeouts
- **Authentication timeout**: 5 seconds (first message must be auth)
- **Pong timeout**: 60 seconds (client must respond to server pings)
- **Write timeout**: 10 seconds (server message send timeout)

### Keepalive
- **Server ping interval**: 54 seconds
- Client WebSocket library should automatically respond with pong
- If client doesn't respond within 60 seconds, connection closes

### Supported Audio Formats
- `webm` (recommended for browser recording)
- `mp3`
- `wav`
- `ogg`
- `m4a`

---

## Error Handling

### Connection Errors

```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error)
  // Show user-friendly error message
  // Attempt reconnection with exponential backoff
}
```

### Authentication Errors

```typescript
if (message.type === 'error' && message.payload.code === 'auth_failed') {
  console.error('Auth failed:', message.payload.error)

  // Token expired - refresh token and reconnect
  if (message.payload.error === 'token expired') {
    const newToken = await refreshAccessToken()
    reconnectWithNewToken(newToken)
  }
}
```

---

## Phase Roadmap

### Phase 1: Audio Storage (Implemented)
- WebSocket connection with first-message authentication
- Audio chunk streaming and buffering
- S3 storage of complete audio turns
- Database persistence of turns
- Message types: `auth`, `auth_success`, `ping`, `pong`, `audio_chunk`, `audio_complete`, `audio_processed`, `error`

### Phase 2: STT + AI Integration (Planned)
- Speech-to-text transcription (Gemini STT or AWS Transcribe)
- AI coach responses (AWS Bedrock Claude)
- Text-to-speech for AI responses
- Real-time feedback scoring (tone, content, pacing)
- Additional message types: `transcript`, `ai_response`, `complete` (functional)

---

## See Also

- [Simulation Setup Documentation](./simulation-setup.md) - Frontend implementation details
- [Core-API Repository](https://github.com/your-org/core-api) - Backend implementation

---

**Last Updated**: January 30, 2026
**Specification Version**: 1.0
**Status**: Phase 1 Implemented
