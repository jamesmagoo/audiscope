/**
 * Simple WebSocket Hook - No Provider, No Complexity
 *
 * Creates ONE WebSocket connection that persists for component lifetime
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseSimpleWebSocketOptions {
  url: string
  debug?: boolean
  reconnect?: boolean
  maxReconnectAttempts?: number
}

export interface UseSimpleWebSocketReturn {
  send: (data: string | ArrayBuffer | Blob) => boolean
  isConnected: boolean
  connectionState: ConnectionState
  error: string | null
  subscribe: (messageType: string, handler: (data: unknown) => void) => () => void
  reconnectAttempt: number
  maxReconnectAttempts: number
  isReconnecting: boolean
  manualReconnect: () => void
}

export function useSimpleWebSocket(options: UseSimpleWebSocketOptions): UseSimpleWebSocketReturn {
  const { url, debug = false, reconnect = true, maxReconnectAttempts = 10 } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isAuthenticatedRef = useRef(false)
  const eventHandlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map())

  const log = useCallback((...args: unknown[]) => {
    if (debug) console.log('[useSimpleWebSocket]', ...args)
  }, [debug])

  // Event subscription
  const subscribe = useCallback((messageType: string, handler: (data: unknown) => void) => {
    if (!eventHandlersRef.current.has(messageType)) {
      eventHandlersRef.current.set(messageType, new Set())
    }
    eventHandlersRef.current.get(messageType)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(messageType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(messageType)
        }
      }
    }
  }, [])

  // Emit event to subscribers
  const emit = useCallback((messageType: string, data: unknown) => {
    const handlers = eventHandlersRef.current.get(messageType)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }, [])

  // Send function
  const send = useCallback((data: string | ArrayBuffer | Blob): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      log('Cannot send - WebSocket not connected')
      return false
    }

    try {
      wsRef.current.send(data)
      return true
    } catch (err) {
      log('Send error:', err)
      return false
    }
  }, [log])

  // Connect function
  const connect = useCallback(async () => {
    // Don't connect if URL is empty (session not created yet)
    if (!url || url === '') {
      log('No URL provided - skipping connection')
      setConnectionState('disconnected')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      log('Already connected or connecting')
      return
    }

    try {
      setConnectionState('connecting')
      setError(null)
      log('Connecting to:', url)

      // Get JWT token
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token available')
      }

      // Create WebSocket
      const ws = new WebSocket(url)
      wsRef.current = ws
      isAuthenticatedRef.current = false

      ws.onopen = () => {
        log('WebSocket opened - sending auth')
        reconnectAttemptRef.current = 0
        setReconnectAttempt(0)

        // Send JWT auth as first message
        ws.send(JSON.stringify({ type: 'auth', token }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          log('Received:', data.type)

          // Handle auth response
          if (data.type === 'auth_success') {
            log('Authenticated successfully', data)
            isAuthenticatedRef.current = true
            setConnectionState('connected')
            setError(null)
            emit('auth_success', data)
          } else if (data.type === 'error') {
            const errorMsg = data.payload?.error || 'Unknown error'
            log('Error from server:', errorMsg)
            setError(errorMsg)

            // Auth errors close connection
            if (data.payload?.code === 'auth_failed') {
              setConnectionState('error')
              ws.close()
            }

            emit('error', data)
          } else if (data.type === 'pong') {
            log('Pong received')
            emit('pong', data)
          } else if (data.type === 'audio_processed') {
            log('Audio processed:', data.payload)
            emit('audio_processed', data)
          } else {
            // Emit all other message types to subscribers
            emit(data.type, data)
          }
        } catch (err) {
          log('Message parse error:', err)
        }
      }

      ws.onerror = (event) => {
        log('WebSocket error:', event)
        setError('WebSocket connection error')
        setConnectionState('error')
      }

      ws.onclose = (event) => {
        log('WebSocket closed:', event.code, event.reason)
        wsRef.current = null
        isAuthenticatedRef.current = false

        if (connectionState !== 'error') {
          setConnectionState('disconnected')
        }

        // Reconnect logic
        if (reconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
          const nextAttempt = reconnectAttemptRef.current + 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000)
          log(`Reconnecting in ${delay}ms (attempt ${nextAttempt}/${maxReconnectAttempts})`)

          reconnectAttemptRef.current = nextAttempt
          setReconnectAttempt(nextAttempt)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          log('Max reconnect attempts reached')
          setError('Connection lost - maximum reconnection attempts reached')
          setConnectionState('error')
        }
      }

    } catch (err) {
      log('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setConnectionState('error')
    }
  }, [url, reconnect, maxReconnectAttempts, log, connectionState])

  // Manual reconnect function (resets attempt counter)
  const manualReconnect = useCallback(() => {
    log('Manual reconnect triggered')

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    // Reset attempt counter
    reconnectAttemptRef.current = 0
    setReconnectAttempt(0)
    setError(null)

    // Reconnect
    connect()
  }, [log, connect])

  // Disconnect function
  const disconnect = useCallback(() => {
    log('Disconnecting')

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    isAuthenticatedRef.current = false
    setConnectionState('disconnected')
  }, [log])

  // Connect when URL becomes available, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]) // Reconnect when URL changes (e.g., when session ID becomes available)

  const isReconnecting = reconnectAttempt > 0 && connectionState !== 'connected'

  return {
    send,
    isConnected: connectionState === 'connected',
    connectionState,
    error,
    subscribe,
    reconnectAttempt,
    maxReconnectAttempts,
    isReconnecting,
    manualReconnect
  }
}
