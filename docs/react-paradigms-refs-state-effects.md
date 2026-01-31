# React Paradigms: Refs, State, and Effects

A comprehensive guide to understanding React's core concepts: when to use state vs refs, how effects work, and common patterns for preventing duplicate renders and API calls.

---

## Table of Contents

1. [State vs Refs: When to Use Each](#state-vs-refs-when-to-use-each)
2. [The Ref Guard Pattern](#the-ref-guard-pattern)
3. [React StrictMode and Double-Mounting](#react-strictmode-and-double-mounting)
4. [useEffect Dependency Arrays](#useeffect-dependency-arrays)
5. [Common Ref Use Cases](#common-ref-use-cases)
6. [Real-World Example: Session Initialization](#real-world-example-session-initialization)
7. [Mental Models and Rules of Thumb](#mental-models-and-rules-of-thumb)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

---

## State vs Refs: When to Use Each

### State (`useState`)

**Purpose**: Data that triggers re-renders when it changes

**Behavior**: When you update state, React re-renders the component and all its children

**Use for**: UI-related data - anything the user sees or interacts with

```typescript
const [sessionState, setSessionState] = useState<SessionState>('idle')
// ✅ Good: sessionState affects UI (loading spinners, button states)

setSessionState('creating')
// Triggers re-render → Component function runs again → UI updates
```

**What happens when state changes:**
1. State update is scheduled
2. React re-renders the component
3. Component function executes from top to bottom
4. React compares new output with previous output (diffing)
5. React updates only the changed parts of the DOM

### Refs (`useRef`)

**Purpose**: Persistent storage that **doesn't** trigger re-renders

**Behavior**: When you update a ref, React does NOT re-render - the value just changes in place

**Use for**: "Remember this value" without affecting UI

```typescript
const hasInitializedSessionRef = useRef(false)
// ✅ Good: Just tracking if we've called the API (no UI impact)

hasInitializedSessionRef.current = true
// NO re-render - value just updates silently
```

**What happens when ref changes:**
1. Value updates immediately
2. Component does NOT re-render
3. Value persists across future re-renders
4. No performance cost

### Side-by-Side Comparison

| Aspect | State | Ref |
|--------|-------|-----|
| **Triggers re-render?** | ✅ Yes | ❌ No |
| **Persists across renders?** | ✅ Yes | ✅ Yes |
| **Survives StrictMode remount?** | ❌ No (resets) | ✅ Yes |
| **Access pattern** | `value` directly | `ref.current` |
| **Update pattern** | `setValue(newValue)` | `ref.current = newValue` |
| **Best for** | UI data | Non-UI data |

---

## The Ref Guard Pattern

### The Problem: Duplicate API Calls

```typescript
// ❌ BAD: Using state in dependency array creates problems
useEffect(() => {
  if (sessionState !== 'idle') return

  setSessionState('creating')  // Changes sessionState
  // ... make API call
  setSessionState('ready')
}, [sessionState])  // Re-runs when sessionState changes!
```

**What happens:**
1. Component mounts, `sessionState = 'idle'`
2. Effect runs, checks `sessionState === 'idle'` ✅
3. Sets `sessionState = 'creating'`
4. **Effect re-runs** because `sessionState` changed
5. Checks `sessionState === 'creating'` (not idle), returns early
6. Sets `sessionState = 'ready'`
7. **Effect re-runs again** because `sessionState` changed
8. Multiple renders, complex flow, potential for bugs

### The Solution: Ref Guard Pattern

```typescript
// ✅ GOOD: Ref prevents duplicate calls
const hasInitializedSessionRef = useRef(false)

useEffect(() => {
  // Guard: Skip if already initialized
  if (hasInitializedSessionRef.current) {
    console.log('Already initialized - skipping')
    return  // Exit early - no API call
  }

  hasInitializedSessionRef.current = true  // Mark as initialized

  // ... make API call (runs only once)
}, [])  // Empty deps - runs once on mount
```

**Why this works:**
- Ref value persists across re-renders (doesn't reset to `false`)
- Updating ref doesn't trigger re-renders
- Empty dependency array `[]` means effect runs only once on mount
- Guard ensures only the first execution proceeds
- Second execution (if any) sees `hasInitializedSessionRef.current = true` and exits

### Advanced: Allowing Retry on Error

```typescript
const hasInitializedSessionRef = useRef(false)

useEffect(() => {
  const initializeSession = async () => {
    if (hasInitializedSessionRef.current) {
      return  // Already initialized
    }

    hasInitializedSessionRef.current = true

    try {
      await createSession()
      setSessionState('ready')
    } catch (err) {
      console.error('Session creation failed:', err)
      setSessionState('error')

      // Reset ref to allow retry
      hasInitializedSessionRef.current = false
    }
  }

  initializeSession()
}, [])
```

**Key insight**: Reset the ref on error to allow the user to retry (e.g., via a "Retry" button that remounts the component).

---

## React StrictMode and Double-Mounting

### What is StrictMode?

In development mode, React's `<StrictMode>` deliberately runs components twice to help catch bugs:

```typescript
// Your app's root:
<StrictMode>
  <App />
</StrictMode>
```

**What StrictMode does:**
- Mounts component
- Runs effects
- **Unmounts component**
- **Re-mounts component**
- **Runs effects again**

**Why?** To help you find bugs related to:
- Missing cleanup functions
- Side effects that assume single execution
- Non-idempotent effects

### How This Causes Double API Calls

```typescript
// WITHOUT ref guard:
1st mount: hasInitialized = false (local state)
           → Effect runs → API call ✅
           → hasInitialized = true
Component unmounts (StrictMode)
2nd mount: hasInitialized = false (state resets!)
           → Effect runs → API call ❌❌ DUPLICATE!

// WITH ref guard:
1st mount: hasInitializedRef.current = false
           → Effect runs → API call ✅
           → hasInitializedRef.current = true
Component unmounts (StrictMode)
2nd mount: hasInitializedRef.current = true (REF PERSISTS!)
           → Effect runs → Guard blocks API call ✅
```

**Key insight**: Refs survive the unmount/remount cycle in StrictMode, state does not.

### Production vs Development

| Environment | StrictMode Behavior |
|-------------|---------------------|
| **Development** | Double-mounting enabled (helps catch bugs) |
| **Production** | StrictMode is no-op (components mount once) |

**Important**: Always test in development to catch issues before production!

---

## useEffect Dependency Arrays

The dependency array is the second argument to `useEffect` and controls **when** the effect re-runs.

### Empty Array `[]` - Run Once on Mount

```typescript
useEffect(() => {
  console.log('Runs ONCE when component mounts')

  return () => {
    console.log('Cleanup when component unmounts')
  }
}, [])  // No dependencies → never re-runs
```

**When it runs:**
- Once when component mounts
- Cleanup runs when component unmounts

**Use for:**
- API calls that should happen once
- Setting up subscriptions
- WebSocket connections
- One-time initialization

### With Dependencies - Run on Change

```typescript
useEffect(() => {
  console.log('Runs when sessionId changes')

  if (!sessionId) return

  // Connect to WebSocket using sessionId
  const ws = new WebSocket(`ws://host/${sessionId}/stream`)

  return () => {
    ws.close()  // Cleanup previous connection
  }
}, [sessionId])  // Re-runs whenever sessionId changes
```

**When it runs:**
- Once when component mounts
- Again whenever `sessionId` changes
- Cleanup runs before re-running and on unmount

**Flow example:**
```
Mount: sessionId = null
  → Effect runs, returns early (no sessionId)

User creates session: sessionId = "abc-123"
  → Cleanup runs (nothing to cleanup)
  → Effect runs, creates WebSocket connection

User creates new session: sessionId = "xyz-789"
  → Cleanup runs, closes WebSocket "abc-123"
  → Effect runs, creates new WebSocket "xyz-789"

Unmount:
  → Cleanup runs, closes WebSocket "xyz-789"
```

### Multiple Dependencies

```typescript
useEffect(() => {
  console.log('Runs when ANY dependency changes')

  fetchData(userId, productId)
}, [userId, productId])  // Re-runs when userId OR productId changes
```

**React compares using `Object.is()`** (similar to `===`):
- Primitives: `5 === 5` → No re-run
- Objects/Arrays: `{} === {}` → False → Re-run (different reference!)

### No Array - Run on Every Render

```typescript
useEffect(() => {
  console.log('Runs after EVERY render')
})  // No array → runs after every render
```

**When it runs:**
- After every render (initial + all updates)
- Usually a performance problem
- Rarely needed

**Warning**: This can create infinite loops if the effect updates state!

```typescript
// ❌ INFINITE LOOP!
useEffect(() => {
  setCount(count + 1)  // Causes re-render
})  // No deps → runs after every render → infinite loop!
```

---

## Common Ref Use Cases

### 1. Preventing Duplicate Effects

```typescript
const hasInitializedRef = useRef(false)

useEffect(() => {
  if (hasInitializedRef.current) {
    console.log('Skipping - already initialized')
    return
  }

  hasInitializedRef.current = true

  // One-time initialization
  initializeApp()
}, [])
```

### 2. Storing WebSocket/Connection References

```typescript
const wsRef = useRef<WebSocket | null>(null)

const connect = useCallback(() => {
  // Close existing connection if any
  if (wsRef.current) {
    wsRef.current.close()
  }

  // Create new connection
  wsRef.current = new WebSocket(url)

  wsRef.current.onmessage = (event) => {
    console.log('Message:', event.data)
  }
}, [url])

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
  }
}, [])
```

**Why ref instead of state?**
- WebSocket instance doesn't need to trigger re-renders
- Storing in state would re-render every time you update it
- Ref gives you direct access to the same instance

### 3. Tracking Previous Values

```typescript
const prevCountRef = useRef<number>()

useEffect(() => {
  // Access previous value
  if (prevCountRef.current !== undefined) {
    console.log(`Count changed from ${prevCountRef.current} to ${count}`)
  }

  // Store current value for next render
  prevCountRef.current = count
}, [count])
```

**How it works:**
```
Render 1: count = 0
  → prevCountRef.current = undefined
  → Effect stores: prevCountRef.current = 0

Render 2: count = 5
  → prevCountRef.current = 0
  → Effect logs: "Count changed from 0 to 5"
  → Effect stores: prevCountRef.current = 5

Render 3: count = 5
  → prevCountRef.current = 5
  → Effect logs: "Count changed from 5 to 5"
  → Effect stores: prevCountRef.current = 5
```

### 4. Storing Timer/Interval References

```typescript
const timerRef = useRef<NodeJS.Timeout | null>(null)

const startTimer = () => {
  // Clear existing timer
  if (timerRef.current) {
    clearInterval(timerRef.current)
  }

  // Start new timer
  timerRef.current = setInterval(() => {
    console.log('Tick')
  }, 1000)
}

const stopTimer = () => {
  if (timerRef.current) {
    clearInterval(timerRef.current)
    timerRef.current = null
  }
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }
}, [])
```

### 5. DOM Element References

```typescript
const inputRef = useRef<HTMLInputElement>(null)
const videoRef = useRef<HTMLVideoElement>(null)

useEffect(() => {
  // Focus input on mount
  inputRef.current?.focus()
}, [])

const handlePlay = () => {
  // Control video playback
  videoRef.current?.play()
}

return (
  <>
    <input ref={inputRef} />
    <video ref={videoRef} />
    <button onClick={handlePlay}>Play</button>
  </>
)
```

### 6. Storing Sequence Counters

```typescript
const sequenceRef = useRef(0)

const sendAudioChunk = (blob: Blob) => {
  const message = {
    type: 'audio_chunk',
    sequence: sequenceRef.current++,  // Increment after use
    data: blob
  }

  websocket.send(JSON.stringify(message))
}

// Reset on recording stop
const stopRecording = () => {
  mediaRecorder.stop()
  sequenceRef.current = 0  // Reset for next recording
}
```

**Why ref instead of state?**
- Incrementing state would trigger re-render for every chunk
- Ref updates instantly without re-render overhead
- Sequence number doesn't affect UI

---

## Real-World Example: Session Initialization

Here's our actual implementation from the voice recorder component:

```typescript
import { useState, useRef, useEffect } from 'react'
import { createSimulationSession } from '@/lib/simulation-api.service'

type SessionState = 'idle' | 'creating' | 'ready' | 'error'

function VoiceRecorder() {
  // STATE: UI-related data that triggers re-renders
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // REF: Guard flag - doesn't need to trigger re-renders
  const hasInitializedSessionRef = useRef(false)

  // Create session on mount (once only)
  useEffect(() => {
    const initializeSession = async () => {
      // Guard: Prevent duplicate calls (React StrictMode safe)
      if (hasInitializedSessionRef.current) {
        console.log('[VoiceRecorder] Session already initialized - skipping')
        return
      }

      // Mark as initialized BEFORE async work
      // (prevents race conditions if effect runs twice)
      hasInitializedSessionRef.current = true

      try {
        // Update UI state: Show loading spinner
        setSessionState('creating')
        setError(null)

        console.log('[VoiceRecorder] Creating simulation session...')

        // Make API call
        const response = await createSimulationSession({
          product_id: 'default-product',
          simulation_type: 'scenario_based',
          scenario_prompt: 'Medical emergency response training',
        })

        console.log('[VoiceRecorder] Session created:', response.session_id)

        // Update UI state: Show ready state, enable buttons
        setSessionId(response.session_id)
        setSessionState('ready')

      } catch (err) {
        console.error('[VoiceRecorder] Failed to create session:', err)

        // Update UI state: Show error message
        setError(err instanceof Error ? err.message : 'Failed to create simulation session')
        setSessionState('error')

        // Reset ref to allow retry
        hasInitializedSessionRef.current = false
      }
    }

    initializeSession()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - run once on mount

  // UI renders based on STATE (not refs)
  return (
    <div>
      {sessionState === 'creating' && <Spinner />}
      {sessionState === 'error' && <Error message={error} />}
      {sessionState === 'ready' && <RecordButton />}
    </div>
  )
}
```

### Why This Pattern Works

1. **Ref guard** (`hasInitializedSessionRef`) prevents duplicate API calls
2. **State** (`sessionState`, `sessionId`, `error`) controls UI rendering
3. **Empty deps array** ensures effect runs only once on mount
4. **StrictMode safe**: Second mount sees ref is `true` and skips
5. **Error handling**: Resets ref to allow manual retry

### What Each Tool Does

| Variable | Type | Purpose | Triggers Re-render? |
|----------|------|---------|---------------------|
| `hasInitializedSessionRef` | Ref | Prevent duplicate API calls | ❌ No |
| `sessionState` | State | Control UI (spinner/error/ready) | ✅ Yes |
| `sessionId` | State | Build WebSocket URL, show in UI | ✅ Yes |
| `error` | State | Display error message to user | ✅ Yes |

---

## Mental Models and Rules of Thumb

### Decision Tree: State vs Ref

```
Does changing this value need to update the UI?
│
├─ YES → Use State
│         Examples: user input, loading state, error messages
│
└─ NO → Use Ref
          Examples: WebSocket instance, timer ID, sequence counter
```

### Decision Tree: useEffect Dependencies

```
When should this effect re-run?
│
├─ Once on mount → Empty array []
│                  Examples: API calls, subscriptions, one-time setup
│
├─ When X changes → Include X in array [x]
│                   Examples: fetch data when userId changes
│
└─ Every render → No array (rare, usually a mistake)
                  Examples: logging every render (debugging only)
```

### Quick Reference Table

| Concept | Purpose | Triggers Re-render? | Persists Across Renders? | Survives StrictMode? |
|---------|---------|---------------------|--------------------------|---------------------|
| **State** | UI data | ✅ Yes | ✅ Yes | ❌ No (resets) |
| **Ref** | Non-UI data | ❌ No | ✅ Yes | ✅ Yes |
| **Local variable** | Temporary data | ❌ No | ❌ No (resets every render) | ❌ No |
| **Props** | Parent data | ✅ Yes (parent re-renders) | ✅ Yes (from parent) | ✅ Yes |

---

## Common Pitfalls and Solutions

### Pitfall 1: Using State for Everything

```typescript
// ❌ BAD: Using state for non-UI data
const [hasInitialized, setHasInitialized] = useState(false)
const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)

useEffect(() => {
  if (hasInitialized) return
  setHasInitialized(true)  // Triggers unnecessary re-render

  const ws = new WebSocket(url)
  setWsInstance(ws)  // Triggers another unnecessary re-render

  // ...
}, [hasInitialized])  // Effect re-runs when state changes
```

**Problems:**
- 2 unnecessary re-renders (performance cost)
- Effect re-runs when `hasInitialized` changes
- More complex dependency management
- Storing WebSocket in state serves no purpose (doesn't affect UI)

```typescript
// ✅ GOOD: Using refs for non-UI data
const hasInitializedRef = useRef(false)
const wsRef = useRef<WebSocket | null>(null)

useEffect(() => {
  if (hasInitializedRef.current) return
  hasInitializedRef.current = true  // No re-render

  wsRef.current = new WebSocket(url)  // No re-render

  // ...
}, [])  // Simple: empty deps, runs once
```

**Benefits:**
- Zero unnecessary re-renders
- Simpler dependency array
- Clear intent: "This is infrastructure, not UI"

### Pitfall 2: Missing Dependencies

```typescript
// ❌ BAD: userId used but not in deps
useEffect(() => {
  fetchUserData(userId)  // Uses userId
}, [])  // userId missing from deps!
```

**Problem**: Effect won't re-run when `userId` changes, showing stale data.

```typescript
// ✅ GOOD: Include all dependencies
useEffect(() => {
  fetchUserData(userId)
}, [userId])  // Re-runs when userId changes
```

**ESLint rule**: `react-hooks/exhaustive-deps` catches these issues.

### Pitfall 3: Object/Array Dependencies

```typescript
// ❌ BAD: Object created on every render
useEffect(() => {
  fetchData(config)
}, [config])  // config = { page: 1 } → new object every render!
```

**Problem**: `{ page: 1 } !== { page: 1 }` (different references), so effect runs every render.

```typescript
// ✅ SOLUTION 1: Depend on primitive values
useEffect(() => {
  fetchData({ page })
}, [page])  // Primitive value, only re-runs when page changes

// ✅ SOLUTION 2: Memoize the object
const config = useMemo(() => ({ page }), [page])
useEffect(() => {
  fetchData(config)
}, [config])  // config reference only changes when page changes

// ✅ SOLUTION 3: Move object inside effect
useEffect(() => {
  const config = { page }
  fetchData(config)
}, [page])
```

### Pitfall 4: Infinite Loops

```typescript
// ❌ INFINITE LOOP!
useEffect(() => {
  setCount(count + 1)  // Updates state
})  // No deps → runs after every render → infinite loop!

// ❌ ALSO INFINITE LOOP!
const [data, setData] = useState([])
useEffect(() => {
  setData([...data, 'item'])  // Updates state
}, [data])  // Depends on data → re-runs → updates data → re-runs...
```

**Solutions:**
```typescript
// ✅ Add empty deps if should run once
useEffect(() => {
  setCount(1)  // Set once on mount
}, [])

// ✅ Use functional update to avoid dependency
useEffect(() => {
  setData(prev => [...prev, 'item'])
}, [])  // No dependency on data

// ✅ Use ref if you don't need re-renders
const countRef = useRef(0)
useEffect(() => {
  countRef.current += 1  // No re-render
})
```

### Pitfall 5: Forgetting Cleanup

```typescript
// ❌ BAD: No cleanup
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick')
  }, 1000)

  // Interval keeps running after unmount!
}, [])
```

**Problem**: Memory leak - interval continues after component unmounts.

```typescript
// ✅ GOOD: Return cleanup function
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick')
  }, 1000)

  return () => {
    clearInterval(interval)  // Cleanup on unmount
  }
}, [])
```

**Cleanup runs:**
- Before effect re-runs (if dependencies change)
- When component unmounts

### Pitfall 6: Async Effects

```typescript
// ❌ BAD: async effect function
useEffect(async () => {  // TypeScript error!
  const data = await fetchData()
  setData(data)
}, [])
```

**Problem**: `useEffect` expects a cleanup function or nothing, not a Promise.

```typescript
// ✅ GOOD: Async function inside effect
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData()
    setData(data)
  }

  loadData()
}, [])

// ✅ GOOD: With cleanup (cancel on unmount)
useEffect(() => {
  let cancelled = false

  const loadData = async () => {
    const data = await fetchData()
    if (!cancelled) {
      setData(data)  // Only update if still mounted
    }
  }

  loadData()

  return () => {
    cancelled = true  // Prevent state update on unmounted component
  }
}, [])
```

---

## Summary: When to Use What

### Use State When:
- ✅ The value affects what the user sees
- ✅ You need the component to re-render when it changes
- ✅ You're managing form inputs, toggles, loading states
- ✅ You're showing/hiding UI elements based on the value

### Use Refs When:
- ✅ You need to remember a value across renders
- ✅ The value doesn't affect the UI
- ✅ You're storing DOM elements, WebSockets, timers
- ✅ You're preventing duplicate effects (guard pattern)
- ✅ You're tracking previous values or sequence numbers

### Use Effects With:
- **Empty deps `[]`**: One-time initialization, subscriptions, API calls on mount
- **With deps `[x, y]`**: Run when specific values change (fetch data when userId changes)
- **No deps**: Almost never (runs on every render, usually a mistake)

### Best Practices:
1. **Start with state** for UI data, **use refs** for everything else
2. **Always include dependencies** - let ESLint guide you
3. **Return cleanup functions** for subscriptions, timers, listeners
4. **Use ref guards** to prevent duplicate effects in StrictMode
5. **Prefer empty deps** for one-time initialization
6. **Test in development** to catch StrictMode issues early

---

## Further Reading

- [React Docs: useState](https://react.dev/reference/react/useState)
- [React Docs: useRef](https://react.dev/reference/react/useRef)
- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
- [React Docs: StrictMode](https://react.dev/reference/react/StrictMode)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

**Last Updated**: January 30, 2026
**Author**: AudiScope Development Team
**Related**: See `docs/simulation-setup.md` for WebSocket implementation examples
