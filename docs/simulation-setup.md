# Simulation Feature - Technical Documentation

## Overview

The Simulation feature enables users to conduct real-time voice conversations with an AI assistant. The feature uses native Web APIs (MediaRecorder, Web Audio API) for audio capture and visualization, with a sleek 3D flip card interface built with Framer Motion.

**Current Status**: Phase 3 Complete (WebSocketProvider Production Ready)
**Next Phase**: Phase 4 - Voice-to-Voice AI Conversation (Audio Playback)

---

## Architecture

### Component Structure

```
app/dashboard/simulation/
└── page.tsx                          # Main page with centered layout

components/simulation/
├── voice-recorder.tsx                # Core recording component with 3D flip card
└── audio-waveform.tsx               # Real-time frequency visualization

lib/
├── simulation-api.service.ts        # API service (WebSocket scaffolding ready)
├── websocket-utils.ts               # WebSocket manager with auth & reconnection
└── audio-playback-utils.ts          # Audio playback queue management (Phase 4)

hooks/
└── use-simulation-websocket.ts      # WebSocket connection management (wrapper)
```

### Data Flow (Current)

1. User clicks microphone button → Requests media access
2. `getUserMedia()` creates MediaStream with audio constraints
3. MediaRecorder captures audio chunks every 100ms
4. Web Audio API AnalyserNode provides frequency data for waveform
5. Audio chunks stored in memory as Blob array
6. On stop → Chunks combined into single audio/webm blob

### Data Flow (Complete with Voice-to-Voice)

1. User clicks microphone button → Requests media access
2. Establish WebSocket connection
3. Send auth message with JWT token (first message)
4. Wait for auth_success response
5. MediaRecorder captures audio chunks every 100ms
6. **Stream chunks immediately to WebSocket** (no local storage)
7. Backend processes chunks in real-time (STT → AI → TTS)
8. Backend sends AI audio response (binary WebSocket message)
9. Frontend receives audio ArrayBuffer
10. Audio playback queue manages sequential playback
11. Audio element plays AI response
12. UI transitions: processing → ai_speaking → idle
13. Conversation history updated with transcriptions

---

## Implementation Details

### 1. Voice Recorder Component (`components/simulation/voice-recorder.tsx`)

#### State Management

```typescript
type RecordingState =
  | 'idle'          // Ready to record
  | 'recording'     // User speaking
  | 'processing'    // Backend processing (STT + AI + TTS)
  | 'ai_speaking'   // AI audio response playing

const [recordingState, setRecordingState] = useState<RecordingState>('idle')
const [recordingTime, setRecordingTime] = useState(0)
const [error, setError] = useState<string | null>(null)
const [stream, setStream] = useState<MediaStream | null>(null)
const [isAnalyserReady, setIsAnalyserReady] = useState(false)

// Phase 4: Voice-to-voice additions
const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([])
const [isAISpeaking, setIsAISpeaking] = useState(false)
const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
```

**Key State Variables**:
- `recordingState`: Controls UI state and flip animation (4 states in Phase 4)
- `recordingTime`: Timer incremented every 1000ms
- `isAnalyserReady`: Triggers re-render when AnalyserNode ready (refs don't cause re-renders)
- `stream`: MediaStream for cleanup tracking
- `conversationHistory`: Array of user/AI message turns (Phase 4)
- `isAISpeaking`: Tracks AI audio playback state (Phase 4)
- `audioPlayerRef`: Reference to hidden audio element for playback (Phase 4)

#### Critical Refs

```typescript
const mediaRecorderRef = useRef<MediaRecorder | null>(null)
const audioChunksRef = useRef<Blob[]>([])
const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
const audioContextRef = useRef<AudioContext | null>(null)
const analyserRef = useRef<AnalyserNode | null>(null)
```

**Why Refs?**:
- MediaRecorder instance needs to persist across renders
- Audio chunks accumulate without triggering re-renders
- AudioContext/AnalyserNode are Web API objects, not React state

#### MediaRecorder Configuration

```typescript
const mediaRecorder = new MediaRecorder(mediaStream, {
  mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm',
})

mediaRecorder.start(100) // Collect data every 100ms
```

**Audio Constraints**:
```typescript
{
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
}
```

**Why 100ms chunks?**:
- Balances latency vs overhead
- Smooth for real-time streaming
- Opus codec optimized for speech

#### Web Audio API Setup

```typescript
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
const source = audioContext.createMediaStreamSource(mediaStream)

analyser.fftSize = 2048
analyser.smoothingTimeConstant = 0.8
source.connect(analyser)
```

**Purpose**: Provides frequency data for waveform visualization without affecting recording

#### Cleanup Pattern (Critical!)

```typescript
// Cleanup effect - ONLY runs on unmount
useEffect(() => {
  return () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
  }
}, []) // Empty dependency array!
```

**Why empty deps?**:
- If `stream` in deps → cleanup runs when stream changes
- Setting stream triggers immediate cleanup → kills recording
- Empty array → only runs on unmount

#### Synchronous Stop Pattern

```typescript
const stopRecording = () => {
  if (mediaRecorderRef.current && recordingState === 'recording') {
    mediaRecorderRef.current.stop() // Triggers async onstop callback

    // CRITICAL: Don't wait for onstop - cleanup immediately
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setIsAnalyserReady(false)
  }
}
```

**Why immediate cleanup?**:
- Prevents microphone staying active in OS (Mac toolbar indicator)
- `onstop` is async and may be delayed
- User expects immediate feedback

---

### 2. Audio Waveform Component (`components/simulation/audio-waveform.tsx`)

#### Visualization Approach

Uses Canvas API with Web Audio API AnalyserNode for real-time frequency visualization.

```typescript
interface AudioWaveformProps {
  analyser: AnalyserNode
}

export function AudioWaveform({ analyser }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Draw symmetric waveform bars (60 bars, mirrored top/bottom)
      for (let i = 0; i < barCount; i++) {
        // Map frequency data to bar height
        const barHeight = normalizeHeight(dataArray[i])

        // Top half
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight / 2)
        // Bottom half (mirror)
        ctx.fillRect(x, centerY, barWidth, barHeight / 2)
      }
    }

    draw()
  }, [analyser])
}
```

#### High DPI Support

```typescript
const dpr = window.devicePixelRatio || 1
canvas.width = rect.width * dpr
canvas.height = 120 * dpr
ctx.scale(dpr, dpr)
```

Ensures crisp rendering on retina displays.

#### Color Integration with Theme

```typescript
const computedStyle = getComputedStyle(document.documentElement)
const primaryHsl = computedStyle.getPropertyValue('--primary').trim()
const primaryColor = `hsl(${primaryHsl})`
```

**Why not CSS variables directly?**:
Canvas API doesn't understand CSS variables - must resolve to computed color.

---

### 3. UI/UX Design

#### 3D Flip Card Animation

Uses Framer Motion for smooth perspective-based card flip.

```typescript
<div style={{ perspective: '1500px' }}>
  <motion.div
    style={{
      transformStyle: 'preserve-3d',
      transformOrigin: 'center center'
    }}
    animate={{
      rotateY: recordingState === 'recording' ? 180 : 0
    }}
    transition={{
      duration: 0.6,
      ease: [0.645, 0.045, 0.355, 1.000] // easeInOutCubic
    }}
  >
    {/* Front Side - rotateY(0deg) */}
    <div style={{
      backfaceVisibility: 'hidden',
      transform: 'rotateY(0deg)',
      transformStyle: 'preserve-3d'
    }}>
      {/* Idle UI */}
    </div>

    {/* Back Side - rotateY(180deg) */}
    <div style={{
      backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      transformStyle: 'preserve-3d'
    }}>
      {/* Recording UI */}
    </div>
  </motion.div>
</div>
```

**Key CSS Properties**:
- `perspective`: Creates 3D depth (lower = more dramatic)
- `transformStyle: preserve-3d`: Enables 3D transforms on children
- `backfaceVisibility: hidden`: Hides back of cards when flipped
- `transformOrigin: center`: Rotates around center point

#### Design Philosophy

**Minimalist & Compact**:
- Max width: `max-w-xl` (36rem)
- Min height: `min-h-[400px]`
- Simple border: `border border-border/50`
- Glassmorphism: `bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl`

**Typography**:
- Timer: `text-5xl font-mono` (tabular nums for consistent width)
- Title: `text-3xl font-bold tracking-tight`
- Labels: `text-sm text-muted-foreground`

**Interactive Elements**:
- Buttons: `h-16 w-16 rounded-full`
- Hover effect: `hover:scale-105 transition-all duration-300`
- Recording indicator: Pulsing red dot with badge

---

### 4. Audio Playback System (`lib/audio-playback-utils.ts`) - Phase 4

#### Overview

The audio playback system manages AI audio responses received via WebSocket, providing sequential playback with automatic memory management.

#### AudioPlaybackQueue Class

Manages a queue of audio responses for sequential playback with event-driven lifecycle.

```typescript
interface AudioResponse {
  sessionId: string
  sequence: number
  format: 'mp3' | 'opus' | 'wav' | 'ogg'
  duration?: number
  arrayBuffer: ArrayBuffer
}

class AudioPlaybackQueue {
  private queue: AudioResponse[]
  private isPlaying: boolean
  private currentObjectURL: string | null

  constructor(
    private audioElement: HTMLAudioElement,
    private onStart?: () => void,
    private onEnd?: () => void,
    private onError?: (error: Error) => void
  )

  /**
   * Add audio response to queue
   * If not currently playing, starts playback immediately
   */
  enqueue(response: AudioResponse): void

  /**
   * Clear all queued items and stop current playback
   */
  clear(): void

  /**
   * Stop current playback and move to next item
   */
  stop(): void

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean

  /**
   * Get current queue length
   */
  size(): number
}
```

#### Key Functions

**`createAudioBlobFromArrayBuffer(buffer: ArrayBuffer, mimeType: string): Blob`**

Converts ArrayBuffer to Blob with appropriate MIME type:

```typescript
const blob = new Blob([arrayBuffer], { type: 'audio/mp3' })
```

**`createObjectURL(blob: Blob): string`**

Creates temporary URL for audio element:

```typescript
const objectURL = URL.createObjectURL(blob)
// Returns: blob:http://localhost:3000/abc123...
```

**`revokeObjectURL(url: string): void`**

Cleanup to prevent memory leaks:

```typescript
URL.revokeObjectURL(objectURL)
```

#### Memory Management

**Critical Pattern**: Always revoke ObjectURLs after use

```typescript
// Bad - Memory leak
audioElement.src = URL.createObjectURL(blob)

// Good - Cleanup after playback
const objectURL = URL.createObjectURL(blob)
audioElement.src = objectURL

audioElement.onended = () => {
  URL.revokeObjectURL(objectURL) // Free memory
  audioElement.src = ''
}
```

**Queue Limits**:
- Maximum queue size: 10 responses
- Automatic cleanup of old URLs
- Clear queue on disconnect

#### Playback Lifecycle

```
1. Receive audio_response metadata → Store format, sequence
2. Receive binary ArrayBuffer → Create AudioResponse
3. Enqueue response
4. AudioPlaybackQueue.enqueue():
   a. If not playing → Start immediately
   b. If playing → Add to queue
5. Playback start:
   a. Create Blob from ArrayBuffer
   b. Create ObjectURL
   c. Set audioElement.src = objectURL
   d. Call audioElement.play()
   e. Fire onStart callback
6. Playback end:
   a. Revoke ObjectURL
   b. Fire onEnd callback
   c. Play next in queue (if any)
```

#### Event Handlers

```typescript
const audioPlaybackQueue = new AudioPlaybackQueue(
  audioPlayerRef.current,

  // onStart
  () => {
    setRecordingState('ai_speaking')
    console.log('AI started speaking')
  },

  // onEnd
  () => {
    if (audioPlaybackQueue.isEmpty()) {
      setRecordingState('idle')
      console.log('AI finished speaking')
    }
  },

  // onError
  (error) => {
    console.error('Playback error:', error)
    toast.error('Failed to play AI response')
    setRecordingState('idle')
  }
)
```

#### Integration with Voice Recorder

**Audio Player Element**:

```tsx
<audio
  ref={audioPlayerRef}
  onEnded={handleAudioEnded}
  onError={handleAudioError}
  onPlay={() => setRecordingState('ai_speaking')}
  style={{ display: 'none' }}
/>
```

**Receiving Audio Responses**:

```typescript
// In use-simulation-websocket.ts
useEffect(() => {
  // Subscribe to audio response metadata
  const unsubscribe = subscribe('audio_response', (data) => {
    const metadata = data as AudioResponseMetadata
    setAwaitingBinaryAudio(metadata)
  })

  return unsubscribe
}, [subscribe])

useEffect(() => {
  // Subscribe to binary messages
  const unsubscribe = subscribe('binaryMessage', (arrayBuffer) => {
    if (awaitingBinaryAudio) {
      const audioResponse: AudioResponse = {
        ...awaitingBinaryAudio,
        arrayBuffer
      }

      // Add to playback queue
      audioPlaybackQueue.enqueue(audioResponse)
      setAwaitingBinaryAudio(null)
    }
  })

  return unsubscribe
}, [subscribe, awaitingBinaryAudio])
```

#### Conversation History

**ConversationTurn Type**:

```typescript
interface ConversationTurn {
  id: string
  type: 'user' | 'ai'
  userTranscription?: string  // What user said
  aiText?: string             // AI's response text
  timestamp: Date
}
```

**Display Component**:

```tsx
{conversationHistory.length > 0 && (
  <Card className="w-full max-w-xl mt-4">
    <CardHeader>
      <CardTitle>Conversation</CardTitle>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[300px]">
        {conversationHistory.map((turn) => (
          <div
            key={turn.id}
            className={cn(
              "mb-4 p-3 rounded-lg",
              turn.type === 'user'
                ? "bg-primary/10 ml-8"
                : "bg-muted mr-8"
            )}
          >
            <div className="text-xs font-semibold mb-1">
              {turn.type === 'user' ? 'You' : 'AI'}
            </div>
            <div className="text-sm">
              {turn.type === 'user'
                ? turn.userTranscription
                : turn.aiText}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {turn.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </ScrollArea>
    </CardContent>
  </Card>
)}
```

---

## Technical Challenges & Solutions

### Problem 1: Timer Not Incrementing

**Issue**: Timer stays at 00:00, never updates.

**Root Cause**:
```typescript
// WRONG
useEffect(() => {
  return () => clearInterval(timerIntervalRef.current)
}, [stream]) // Cleanup runs when stream changes!
```

When `setStream(mediaStream)` was called, React re-ran the effect, which immediately called the cleanup function, clearing the interval.

**Solution**:
```typescript
// CORRECT
useEffect(() => {
  return () => clearInterval(timerIntervalRef.current)
}, []) // Only cleanup on unmount
```

**Lesson**: Be careful with cleanup dependencies - they run on every change, not just unmount.

---

### Problem 2: Waveform Never Appears

**Issue**: Conditional render `{analyserRef.current && <AudioWaveform />}` never evaluates to true.

**Root Cause**: Setting a ref doesn't trigger re-render.

```typescript
// This doesn't cause re-render
analyserRef.current = analyser
```

**Solution**: Add state variable to trigger re-render.

```typescript
const [isAnalyserReady, setIsAnalyserReady] = useState(false)

// When creating analyser
analyserRef.current = analyser
setIsAnalyserReady(true) // Triggers re-render

// In JSX
{recordingState === 'recording' && isAnalyserReady && analyserRef.current && (
  <AudioWaveform analyser={analyserRef.current} />
)}
```

**Lesson**: Refs are for persistence across renders, state is for triggering re-renders.

---

### Problem 3: Microphone Stays Active (Mac Toolbar)

**Issue**: After stopping recording, Mac toolbar shows microphone still active.

**Root Cause**: Stream cleanup only in async `onstop` callback.

```typescript
mediaRecorder.onstop = async () => {
  // ... processing

  // This runs later (async)
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
}
```

**Solution**: Immediate synchronous cleanup in `stopRecording()`.

```typescript
const stopRecording = () => {
  mediaRecorderRef.current.stop()

  // Don't wait - stop immediately
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    setStream(null)
  }
}
```

**Lesson**: OS-level indicators respond to synchronous cleanup, not async callbacks.

---

### Problem 4: AudioContext Closed Error

**Issue**: `Error: Cannot close a closed AudioContext`

**Root Cause**: Attempting to close already-closed context.

**Solution**: Check state before closing.

```typescript
if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
  audioContextRef.current.close()
}
```

**Lesson**: Always check state of Web API objects before operations.

---

## Current Limitations

**Phases 1-3 Complete**: Basic recording, WebSocket streaming, and connection management fully implemented.

**Phase 4 Limitations** (Voice-to-Voice Conversation):

1. **No Audio Playback**: AI audio responses not yet implemented - frontend can receive but not play audio
2. **No Conversation History UI**: No display of past user/AI message turns
3. **No Interrupt Handling**: Cannot gracefully stop AI mid-speech to start new recording
4. **No Audio Format Selection**: Backend determines audio format (MP3/Opus/WAV)
5. **No Playback Controls**: No pause/resume functionality for AI audio responses
6. **No Persistent Storage**: Conversation history lost on page refresh
7. **No Error Recovery for Audio**: Failed audio playback requires manual retry

---

## Next Steps: Phase 4 - Voice-to-Voice AI Conversation

**Status**: Planned
**GitHub Issue**: [#16 - Implement Voice-to-Voice AI Conversation](https://github.com/jamesmagoo/audiscope/issues/16)
**Prerequisites**: Phases 1-3 Complete (Audio capture, WebSocket streaming, Provider architecture)

### Overview

Phase 4 implements the complete voice-to-voice conversation loop where users speak into the microphone, audio is streamed to the backend for STT → AI processing → TTS, and AI audio responses are streamed back and played through the browser.

### Architecture Overview

```
┌──────────────┐      WebSocket (Binary)     ┌──────────────┐
│   Browser    │────────────────────────────▶│   Backend    │
│              │                              │              │
│ MediaRecorder│  Audio Chunks (100ms)       │ STT Service  │
│   (Opus)     │────────────────────────────▶│      ↓       │
│              │                              │  AI Engine   │
│  AudioQueue  │◀────────────────────────────│      ↓       │
│ <audio> elem │  AI Audio Response (Binary) │  TTS Service │
└──────────────┘                              └──────────────┘
```

**User Flow**:
1. User speaks → Audio streamed to backend (✅ Complete)
2. Backend: STT → AI → TTS (Backend implementation)
3. Backend streams audio response → Frontend (NEW)
4. Frontend plays AI audio → Displays conversation history (NEW)

### Implementation Phases

Detailed implementation steps with checkpoints are available in **GitHub Issue #16**.

**Key Implementation Areas**:

#### 1. Audio Playback Utilities (`lib/audio-playback-utils.ts`)

Create reusable audio playback system:
- `AudioPlaybackQueue` class for sequential playback
- Memory-safe ObjectURL management
- Event-driven lifecycle (onStart, onEnd, onError)
- Queue management (max 10 responses)

See: "Phase 4: Audio Playback System" section above (lines 341-599) for detailed API documentation.

#### 2. WebSocket Hook Extensions (`hooks/use-simulation-websocket.ts`)

Extend existing hook to handle audio responses:
- Subscribe to `audio_response` and `binaryMessage` events
- Subscribe to `user_transcription` for user speech text
- Subscribe to `ai_text` for AI response text
- Manage conversation history state
- Integrate with AudioPlaybackQueue

#### 3. UI Component Updates (`components/simulation/voice-recorder.tsx`)

Add audio playback and conversation display:
- Hidden `<audio>` element for AI response playback
- Expand state machine: `idle | recording | processing | ai_speaking`
- Conversation history panel with ScrollArea
- AI speaking indicator with animation
- User interrupt handling (stop AI to start recording)

#### 4. State Transitions

```
idle → (user clicks record) → recording
recording → (user stops) → processing
processing → (backend sends audio) → ai_speaking
ai_speaking → (audio ends) → idle

Special Cases:
- User records during ai_speaking → stop audio, → recording
- Error during processing → show error, → idle
- Disconnect during any state → show error, → disconnected
```

#### 5. Message Sequence Example

```
1. Client → Server: Binary audio chunks (while recording)
2. Server → Client: { type: "status", state: "transcribing" }
3. Server → Client: { type: "user_transcription", text: "...", isFinal: true }
4. Server → Client: { type: "status", state: "thinking" }
5. Server → Client: { type: "ai_text", content: "..." }
6. Server → Client: { type: "status", state: "speaking" }
7. Server → Client: { type: "audio_response", format: "mp3", sequence: 0 }
8. Server → Client: Binary ArrayBuffer (MP3 audio data)
9. Client: Play audio, update conversation history
```

### Message Protocol (Voice-to-Voice Conversation)

**Client → Server (Audio Chunk)**:
```typescript
// Binary WebSocket message
{
  type: 'audio_chunk',
  sessionId: string,
  sequence: number,
  timestamp: number,
  data: ArrayBuffer // Opus-encoded audio
}
```

**Server → Client (Audio Response - Binary) - Phase 4**:
```typescript
// 1. Metadata message (JSON)
{
  type: 'audio_response',
  sessionId: string,
  sequence: number,
  format: 'mp3' | 'opus' | 'wav' | 'ogg',
  duration?: number,
  timestamp: number
}

// 2. Binary message (ArrayBuffer) immediately after
<ArrayBuffer containing audio data>
```

**Server → Client (User Transcription) - Phase 4**:
```typescript
// JSON WebSocket message
{
  type: 'user_transcription',
  text: string,
  isFinal: boolean,  // true when complete, false for partial
  timestamp: number
}
```

**Server → Client (AI Text) - Phase 4**:
```typescript
// JSON WebSocket message
{
  type: 'ai_text',
  content: string,
  timestamp: number
}
```

**Server → Client (AI Response - Deprecated)**:
```typescript
// Deprecated: Use ai_text for text responses
// Kept for backward compatibility
{
  type: 'ai_response',
  sessionId: string,
  content: string,
  isFinal: boolean,
  timestamp: number
}
```

**Server → Client (Status)**:
```typescript
{
  type: 'status',
  state: 'connected' | 'transcribing' | 'thinking' | 'speaking' | 'ready' | 'processing' | 'error',
  message?: string
}
```

### WebSocket Authentication

Uses **first message authentication** pattern - JWT token sent as first WebSocket message:

```typescript
// 1. Fetch JWT token from AWS Amplify session
const authHeaders = await getAuthHeaders() // Returns { Authorization: 'Bearer <token>' }
const token = authHeaders.Authorization?.replace('Bearer ', '')

// 2. Establish WebSocket connection (no token in URL)
const ws = new WebSocket(NEXT_PUBLIC_SIMULATION_WS_URL)

// 3. Send auth as first message when connection opens
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: token
  }))
}

// 4. Handle auth response
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'auth_success') {
    // Connection authenticated, can now send messages
    setState('connected')
  }
}
```

**See:** `lib/websocket-utils.ts` for full implementation with timeout handling and reconnection logic.

Backend validates token on connection.

### Success Criteria

✅ User can speak and audio streams to backend (already working)
✅ Frontend receives AI audio responses from backend
✅ AI audio plays automatically after processing
✅ Conversation history displays (user text + AI text)
✅ UI shows clear states (idle, recording, processing, AI speaking)
✅ No memory leaks from audio ObjectURLs
✅ Smooth state transitions with animations
✅ Error handling for all failure scenarios

---

## Performance Considerations

### Audio Chunking

- **Chunk Size**: 100ms
- **Format**: WebM with Opus codec
- **Bitrate**: Default (adaptive, typically 32-64 kbps for speech)
- **Latency**: ~100-200ms end-to-end (network + processing)

### Memory Management

**Current (Phase 1)**:
- Audio chunks stored in memory as Blob array
- Combined into single blob on stop
- Not suitable for long recordings

**Planned (Phase 2 with WebSocket)**:
- Chunks sent immediately, not stored
- Scalable for unlimited recording duration
- Memory footprint constant (~100ms worth of audio)

### Network Considerations

- **Binary WebSocket**: More efficient than base64 JSON
- **Compression**: Opus codec already compressed
- **Backpressure**: Queue chunks if WebSocket slow
- **Bandwidth**: ~32-64 kbps audio + minimal protocol overhead

---

## Testing Recommendations

### Unit Tests (Future)

- MediaRecorder mock for recording flow
- AudioContext mock for waveform
- WebSocket mock for streaming
- Timer and state transitions

### Integration Tests (Future)

- End-to-end recording → processing → response
- Reconnection scenarios
- Error handling (mic denied, network failure)
- Long recording sessions

### Manual Testing Checklist

- [ ] Microphone permission prompt
- [ ] Timer counts correctly
- [ ] Waveform visualizes audio
- [ ] Stop button works immediately
- [ ] Mac toolbar mic indicator turns off
- [ ] Error states display correctly
- [ ] Card flip animation smooth
- [ ] Works on mobile browsers
- [ ] Handles denied microphone permission

---

## Browser Compatibility

### Supported APIs

| API | Chrome | Firefox | Safari | Edge |
|-----|--------|---------|--------|------|
| MediaRecorder | ✅ 47+ | ✅ 25+ | ✅ 14.1+ | ✅ 79+ |
| Web Audio API | ✅ 35+ | ✅ 25+ | ✅ 14.1+ | ✅ 79+ |
| WebSocket | ✅ 43+ | ✅ 11+ | ✅ 12.1+ | ✅ 79+ |
| getUserMedia | ✅ 53+ | ✅ 36+ | ✅ 11+ | ✅ 79+ |

### Known Issues

- **Safari iOS**: Requires user interaction for microphone access
- **Firefox**: May use different codecs (vorbis instead of opus)
- **Older browsers**: Fallback to basic recording without visualization

---

## References

### Documentation
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Framer Motion Documentation](https://www.framer.com/motion/)

### Code References
- `components/simulation/voice-recorder.tsx` (lines 1-390)
- `components/simulation/audio-waveform.tsx` (lines 1-150)
- `lib/simulation-api.service.ts` (lines 218-249 - WebSocket scaffold)
- `lib/api-utils.ts` (JWT authentication utilities)

---

## Changelog

### Phase 1 - Initial Implementation (Completed)
- Created simulation page and routing
- Implemented MediaRecorder-based recording
- Built 3D flip card UI with Framer Motion
- Added real-time audio waveform visualization
- Fixed timer cleanup race condition
- Fixed microphone not releasing properly
- Fixed waveform visibility issue
- Refined design to minimal, compact aesthetic

### Phase 2 - WebSocket Integration (Completed)
- WebSocket service layer (lib/websocket-utils.ts)
- Real-time audio streaming via WebSocketProvider
- AI response handling through event subscriptions
- Connection management & auto-reconnection
- Error handling & recovery with exponential backoff
- First message JWT authentication with session tracking

### Phase 3 - WebSocketProvider Refactor (Completed)
- Created centralized WebSocketProvider (components/providers/websocket-provider.tsx)
- Refactored use-simulation-websocket.ts to use provider (~85% code reduction)
- Added provider to app/layout.tsx hierarchy
- Comprehensive documentation (docs/websocket-provider.md)
- Support for multiple connection types (simulation, notifications, assessments)
- Connection pooling and state management
- Backward compatible API

### Phase 4 - Voice-to-Voice Conversation (Planned)
- Audio playback utilities (lib/audio-playback-utils.ts)
- AudioPlaybackQueue class for sequential AI response playback
- Conversation history display with user/AI messages
- Extended state machine with `ai_speaking` state
- Audio response message protocol (binary WebSocket)
- Transcription and AI text message subscriptions
- Memory-safe ObjectURL management
- User interrupt handling (stop AI to start recording)
- Related: GitHub Issue [#16](https://github.com/jamesmagoo/audiscope/issues/16)

---

## WebSocketProvider Architecture (Phase 3 Refactor)

### Overview

The simulation feature now uses a centralized WebSocketProvider for connection management. This provides:

- **Single source of truth** for all WebSocket connections
- **Connection pooling** by type (prevents duplicate connections)
- **Shared state** across components
- **Simplified component code** (~180 lines → ~20 lines in VoiceRecorder)
- **Centralized error handling**
- **Automatic JWT authentication**

### Architecture Diagram

```
app/layout.tsx:
  ThemeProvider
    └─ AuthProvider (JWT tokens)
        └─ QueryProvider
            └─ WebSocketProvider ← Manages all WebSocket connections
                └─ VoiceRecorder (uses useSimulationWebSocket hook)
                    └─ useWebSocket('simulation') ← Accesses provider
```

### Usage in Components

The simulation components use the same `useSimulationWebSocket` hook, but it now delegates to the provider:

```typescript
// In components/simulation/voice-recorder.tsx
const {
  connect,
  disconnect,
  sendAudioChunk,
  connectionState,
  isConnected,
  messages,
  error
} = useSimulationWebSocket({ debug: true })

// Behind the scenes, this now uses:
// useWebSocket('simulation') from WebSocketProvider
```

**Benefits:**
- No change to component code (backward compatible)
- Provider handles connection lifecycle
- Automatic cleanup on unmount
- Shared connection across multiple components
- Centralized reconnection logic

### Adding New WebSocket Features

To add new real-time features (e.g., notifications):

1. **Add environment variable:**
   ```bash
   NEXT_PUBLIC_NOTIFICATIONS_WS_URL=wss://your-endpoint.com
   ```

2. **Use in component:**
   ```typescript
   const { send, subscribe } = useWebSocket('notifications', true) // Auto-connect

   useEffect(() => {
     return subscribe('notification', (data) => {
       toast.info(data.title, { description: data.message })
     })
   }, [subscribe])
   ```

3. **No provider changes needed!** The provider automatically manages new connection types.

### Documentation

For complete WebSocketProvider documentation, see: `docs/websocket-provider.md`

Topics covered:
- API reference
- Usage patterns
- Configuration
- Message protocol
- Reconnection strategy
- Error handling
- Authentication
- Best practices
- Troubleshooting

---

**Last Updated**: January 29, 2026
**Author**: Development Team
**Status**: Phase 3 Complete - Phase 4 (Voice-to-Voice) Planned
**Related**: GitHub Issue [#16](https://github.com/jamesmagoo/audiscope/issues/16)
