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

#### ⚠️ IMPORTANT: Message Ordering

The client **must** wait for all audio chunks to finish processing before sending `audio_complete`. The implementation in `voice-recorder.tsx` handles this by:

1. Storing pending chunk promises in `pendingChunkRef`
2. Waiting for the final chunk to complete in `mediaRecorder.onstop`
3. Only then sending `audio_complete` message

This prevents race conditions where `audio_complete` arrives before final chunks.

**Event Subscription:**

```typescript
subscribe('audio_processed', (data) => {
  console.log(`Turn ${data.payload.turn_number} saved`)
})
```

## Phase 2: AI Audio Streaming (Implemented)

### AI Audio Response Flow

After the user finishes speaking, the AI coach responds with audio:

**Message Sequence:**
1. `ai_audio_streaming_started` → Initialize playback, show UI
2. `ai_audio_chunk` × N → Buffer and play audio in real-time
3. `ai_audio_complete` → Finalize playback
4. `audio_processed` → Final confirmation with S3 URLs

### Real-Time Audio Playback

**Implementation in `voice-recorder.tsx`:**

```typescript
// Subscribe to AI audio messages
useEffect(() => {
  // 1. Start streaming
  const unsubStart = subscribe('ai_audio_streaming_started', (data) => {
    const { format, sample_rate, total_chunks } = data.payload

    // Create separate AudioContext for AI (don't interfere with mic)
    const aiContext = new AudioContext()
    const aiAnalyser = aiContext.createAnalyser()

    // Create audio queue for buffering and playback
    const audioQueue = new AudioQueue(aiContext, aiAnalyser, onComplete)

    setAiSpeaking(true)
    setAiAudioProgress({ current: 0, total: total_chunks })
  })

  // 2. Receive chunks
  const unsubChunk = subscribe('ai_audio_chunk', async (data) => {
    const { chunk_sequence, total_chunks, audio_chunk } = data.payload

    // Decode MP3
    const arrayBuffer = base64ToArrayBuffer(audio_chunk)
    const audioBuffer = await decodeMP3(aiAudioContext, arrayBuffer)

    // Add to playback queue
    audioQueue.addChunk(chunk_sequence, audioBuffer)

    // Update progress: "Speaking 7/15"
    setAiAudioProgress({ current: chunk_sequence, total: total_chunks })
  })

  // 3. Complete
  const unsubComplete = subscribe('ai_audio_complete', (data) => {
    audioQueue.finalize() // Play remaining buffered chunks
  })
}, [subscribe])
```

### Audio Utilities (`lib/audio-utils.ts`)

**AudioQueue Class:**
- Buffers first 3-5 chunks before starting playback (smooth start)
- Plays chunks sequentially with no gaps
- Connects to AnalyserNode for waveform visualization
- Calls completion callback when finished

**Key Functions:**
- `base64ToArrayBuffer()` - Decode base64 audio data
- `decodeMP3()` - Decode MP3 using AudioContext.decodeAudioData()
- `AudioQueue.addChunk()` - Buffer and play audio chunks
- `AudioQueue.finalize()` - Play remaining chunks after all received

### UI Behavior

**While AI is speaking:**
- Show "AI Speaking (7/15)" badge with progress
- Display AI waveform visualization
- Disable record button (no interruption)
- Tooltip: "Waiting for AI to finish speaking..."

**After AI finishes:**
- Hide AI waveform
- Enable record button
- User can speak again

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
