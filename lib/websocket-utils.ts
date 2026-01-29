/**
 * WebSocket Utilities for Real-Time Communication
 *
 * Provides robust WebSocket connection management with:
 * - JWT authentication
 * - Automatic reconnection with exponential backoff
 * - Event-driven message handling
 * - Connection state management
 * - Error handling and logging
 */

import { getAuthHeaders } from './api-utils'

export type WebSocketState = 'connecting' | 'authenticating' | 'connected' | 'disconnecting' | 'disconnected' | 'error'

export interface WebSocketMessage {
  type: string
  [key: string]: unknown
}

export interface WebSocketConfig {
  url: string
  protocols?: string | string[]
  reconnect?: boolean
  maxReconnectAttempts?: number
  maxReconnectDelay?: number
  debug?: boolean
}

export interface WebSocketSessionInfo {
  sessionId: string
  userId: string
  timestamp: string
}

export interface WebSocketManager {
  connect: () => Promise<void>
  disconnect: () => void
  send: (data: string | ArrayBuffer | Blob) => boolean
  sendJSON: (data: WebSocketMessage) => boolean
  on: (event: string, handler: (data: unknown) => void) => void
  off: (event: string, handler: (data: unknown) => void) => void
  getState: () => WebSocketState
  isConnected: () => boolean
  getSessionInfo: () => WebSocketSessionInfo | null
}

/**
 * Creates a managed WebSocket connection with automatic reconnection and auth
 */
export function createWebSocketManager(config: WebSocketConfig): WebSocketManager {
  const {
    url,
    protocols,
    reconnect = true,
    maxReconnectAttempts = 10,
    maxReconnectDelay = 30000, // 30 seconds
    debug = false
  } = config

  let ws: WebSocket | null = null
  let state: WebSocketState = 'disconnected'
  let reconnectAttempts = 0
  let reconnectTimeout: NodeJS.Timeout | null = null
  let isIntentionalDisconnect = false

  // Authentication state
  let authToken: string | null = null
  let authTimeout: NodeJS.Timeout | null = null
  let sessionInfo: WebSocketSessionInfo | null = null

  // Event handlers registry
  const eventHandlers = new Map<string, Set<(data: unknown) => void>>()

  // Message queue for when connection is not ready
  const messageQueue: (string | ArrayBuffer | Blob)[] = []
  const maxQueueSize = 100

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[WebSocketManager]', ...args)
    }
  }

  const error = (...args: unknown[]) => {
    console.error('[WebSocketManager]', ...args)
  }

  const setState = (newState: WebSocketState) => {
    if (state !== newState) {
      log(`State change: ${state} → ${newState}`)
      state = newState
      emit('stateChange', newState)
    }
  }

  const emit = (event: string, data: unknown) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (err) {
          error(`Error in ${event} handler:`, err)
        }
      })
    }
  }

  const calculateReconnectDelay = (): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts),
      maxReconnectDelay
    )
    return delay
  }

  const scheduleReconnect = () => {
    if (!reconnect || isIntentionalDisconnect) {
      log('Reconnection disabled or intentional disconnect')
      return
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      error(`Max reconnection attempts (${maxReconnectAttempts}) reached`)
      setState('error')
      emit('maxReconnectAttemptsReached', reconnectAttempts)
      return
    }

    const delay = calculateReconnectDelay()
    log(`Scheduling reconnect attempt ${reconnectAttempts + 1} in ${delay}ms`)

    reconnectTimeout = setTimeout(() => {
      reconnectAttempts++
      emit('reconnecting', { attempt: reconnectAttempts, delay })
      connect()
    }, delay)
  }

  const processMessageQueue = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    log(`Processing ${messageQueue.length} queued messages`)
    while (messageQueue.length > 0) {
      const message = messageQueue.shift()
      if (message) {
        try {
          ws.send(message)
        } catch (err) {
          error('Error sending queued message:', err)
          // Re-queue if send fails
          messageQueue.unshift(message)
          break
        }
      }
    }
  }

  const setupWebSocket = (socket: WebSocket) => {
    socket.onopen = () => {
      log('WebSocket opened, sending auth message')
      setState('authenticating')

      // Send auth as first message
      if (!authToken) {
        error('No auth token available to send')
        setState('error')
        emit('authenticationError', 'No auth token available')
        socket.close(4001, 'Authentication failed')
        return
      }

      const authMessage = {
        type: 'auth',
        token: authToken
      }

      try {
        socket.send(JSON.stringify(authMessage))
        log('Auth message sent')

        // Set 5 second auth timeout
        authTimeout = setTimeout(() => {
          if (state === 'authenticating') {
            error('Authentication timeout (5s)')
            setState('error')
            emit('authenticationTimeout', undefined)
            socket.close(4002, 'Authentication timeout')
          }
        }, 5000)
      } catch (err) {
        error('Failed to send auth message:', err)
        setState('error')
        emit('authenticationError', err)
        socket.close(4001, 'Authentication failed')
      }
    }

    socket.onclose = (event) => {
      log('WebSocket closed', { code: event.code, reason: event.reason, wasClean: event.wasClean })

      // Clear auth timeout if still active
      if (authTimeout) {
        clearTimeout(authTimeout)
        authTimeout = null
      }

      // Clear session info
      sessionInfo = null

      setState('disconnected')
      emit('disconnected', { code: event.code, reason: event.reason })

      // Attempt reconnection if not intentional
      if (!isIntentionalDisconnect && reconnect) {
        scheduleReconnect()
      }
    }

    socket.onerror = (event) => {
      error('WebSocket error:', event)
      setState('error')
      emit('error', event)
    }

    socket.onmessage = (event) => {
      log('Message received:', event.data)

      // Handle binary messages
      if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
        emit('binaryMessage', event.data)
        return
      }

      // Handle text messages (JSON)
      try {
        const message = JSON.parse(event.data) as WebSocketMessage

        // Handle auth during authenticating state
        if (state === 'authenticating') {
          if (message.type === 'auth_success') {
            log('✅ Auth successful:', message)

            // Clear auth timeout
            if (authTimeout) {
              clearTimeout(authTimeout)
              authTimeout = null
            }

            // Store session info
            sessionInfo = {
              sessionId: (message as { session_id?: string }).session_id || '',
              userId: (message as { user_id?: string }).user_id || '',
              timestamp: (message as { timestamp?: string }).timestamp || new Date().toISOString()
            }

            // Transition to connected
            setState('connected')
            reconnectAttempts = 0
            emit('connected', sessionInfo)

            // Now safe to send queued messages
            processMessageQueue()
            return
          }

          if (message.type === 'auth_error') {
            error('❌ Auth failed:', message)

            // Clear auth timeout
            if (authTimeout) {
              clearTimeout(authTimeout)
              authTimeout = null
            }

            setState('error')
            emit('authenticationError', (message as { error?: string }).error || 'Authentication failed')
            socket.close(4001, 'Authentication failed')
            return
          }

          // Ignore other messages during auth
          log('Ignoring message during authentication:', message.type)
          return
        }

        // Normal message handling (only when connected)
        emit('message', message)

        // Emit type-specific events
        if (message.type) {
          emit(message.type, message)
        }
      } catch (err) {
        error('Error parsing message:', err)
        emit('parseError', { data: event.data, error: err })
      }
    }
  }

  const connect = async (): Promise<void> => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      log('WebSocket already connecting or connected')
      return
    }

    try {
      setState('connecting')
      isIntentionalDisconnect = false

      // Get JWT token for authentication (will be sent as first message)
      log('Fetching auth token...')
      const authHeaders = await getAuthHeaders()
      const token = authHeaders.Authorization?.replace('Bearer ', '')

      if (!token) {
        throw new Error('No authentication token available')
      }

      // Store token for auth message (don't send in URL)
      authToken = token
      log('Connecting to:', url)

      // Create WebSocket connection without token
      ws = new WebSocket(url, protocols)
      setupWebSocket(ws)

    } catch (err) {
      error('Connection error:', err)
      setState('error')
      emit('connectionError', err)

      // Schedule reconnect on connection failure
      if (reconnect && !isIntentionalDisconnect) {
        scheduleReconnect()
      }
    }
  }

  const disconnect = () => {
    log('Disconnecting...')
    isIntentionalDisconnect = true

    // Clear reconnection timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    // Clear auth timeout
    if (authTimeout) {
      clearTimeout(authTimeout)
      authTimeout = null
    }

    // Clear session info
    sessionInfo = null
    authToken = null

    // Close WebSocket
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        setState('disconnecting')
        ws.close(1000, 'Client disconnect')
      }
      ws = null
    }

    setState('disconnected')
    reconnectAttempts = 0
  }

  const send = (data: string | ArrayBuffer | Blob): boolean => {
    if (!ws) {
      error('Cannot send: WebSocket not initialized')
      return false
    }

    // Block sending if not ready (includes authenticating state)
    if (ws.readyState !== WebSocket.OPEN || state === 'authenticating') {
      log(`WebSocket not ready (state: ${state}), queuing message`)

      // Queue message if within limit
      if (messageQueue.length < maxQueueSize) {
        messageQueue.push(data)
        return true
      } else {
        error('Message queue full, dropping message')
        return false
      }
    }

    try {
      ws.send(data)
      return true
    } catch (err) {
      error('Error sending message:', err)
      return false
    }
  }

  const sendJSON = (data: WebSocketMessage): boolean => {
    try {
      const json = JSON.stringify(data)
      return send(json)
    } catch (err) {
      error('Error serializing JSON:', err)
      return false
    }
  }

  const on = (event: string, handler: (data: unknown) => void) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, new Set())
    }
    eventHandlers.get(event)!.add(handler)
  }

  const off = (event: string, handler: (data: unknown) => void) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        eventHandlers.delete(event)
      }
    }
  }

  const getState = (): WebSocketState => state

  const isConnected = (): boolean => state === 'connected'

  const getSessionInfo = (): WebSocketSessionInfo | null => sessionInfo

  return {
    connect,
    disconnect,
    send,
    sendJSON,
    on,
    off,
    getState,
    isConnected,
    getSessionInfo
  }
}

/**
 * Helper to create an authenticated WebSocket URL with JWT token
 * @deprecated This is no longer used as auth is now sent as first message
 * Kept for backward compatibility if needed
 */
export async function createAuthenticatedWebSocketURL(baseUrl: string): Promise<string> {
  const authHeaders = await getAuthHeaders()
  const token = authHeaders.Authorization?.replace('Bearer ', '')

  if (!token) {
    throw new Error('No authentication token available')
  }

  return `${baseUrl}?token=${encodeURIComponent(token)}`
}
