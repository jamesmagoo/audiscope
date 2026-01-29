/**
 * React Hook for Simulation WebSocket Connection
 *
 * Provides easy-to-use interface for real-time AI conversation via WebSocket.
 * Now uses WebSocketProvider for centralized connection management.
 *
 * Example usage:
 *
 * const {
 *   connect,
 *   disconnect,
 *   sendAudioChunk,
 *   connectionState,
 *   messages,
 *   isConnected,
 *   error
 * } = useSimulationWebSocket({ sessionId: 'abc123' })
 *
 * useEffect(() => {
 *   connect()
 *   return () => disconnect()
 * }, [])
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from '@/components/providers/websocket-provider'
import type { AIResponseMessage, StatusMessage } from '@/lib/simulation-api.service'
import type { WebSocketState } from '@/lib/websocket-utils'

export interface SimulationWebSocketOptions {
  sessionId?: string
  scenario?: string
  role?: string
  debug?: boolean
  autoConnect?: boolean // Automatically connect on mount
}

export interface AIMessage {
  id: string
  type: 'user' | 'ai' | 'status'
  content: string
  timestamp: number
  isFinal?: boolean
}

export interface UseSimulationWebSocketReturn {
  // Connection methods
  connect: () => Promise<void>
  disconnect: () => void

  // Messaging methods
  sendAudioChunk: (audioBlob: Blob) => Promise<boolean>

  // State
  connectionState: WebSocketState
  isConnected: boolean
  messages: AIMessage[]
  error: string | null

  // Session info
  sessionId?: string
}

export function useSimulationWebSocket( options: SimulationWebSocketOptions = {}): UseSimulationWebSocketReturn {
  const {
    sessionId: initialSessionId,
    scenario,
    role,
    debug = false,
    autoConnect = false
  } = options

  // Use WebSocketProvider for connection management
  const {
    connect: connectWS,
    disconnect: disconnectWS,
    subscribe,
    connectionState,
    isConnected,
    error: wsError,
    send
  } = useWebSocket('simulation', autoConnect)

  // Local state
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)
  const [error, setError] = useState<string | null>(null)
  const audioSequenceRef = useRef(0)

  // Sync error from WebSocket provider
  useEffect(() => {
    setError(wsError)
  }, [wsError])

  /**
   * Connect to WebSocket with session configuration
   */
  const connect = useCallback(async () => {
    try {
      setError(null)

      // Connect via provider (will send join message automatically)
      await connectWS({
        options: {
          sessionId,
          scenario,
          role
        },
        debug
      })

    } catch (err) {
      console.error('[useSimulationWebSocket] Failed to connect:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }, [connectWS, sessionId, scenario, role, debug])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    disconnectWS()
    audioSequenceRef.current = 0
  }, [disconnectWS])

  /**
   * Send audio chunk to server
   */
  const sendAudioChunk = useCallback(async (audioBlob: Blob): Promise<boolean> => {
    if (!isConnected) {
      console.error('[useSimulationWebSocket] Cannot send audio - not connected')
      return false
    }

    try {
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer()

      // Create metadata message
      const metadata = {
        type: 'audio_chunk',
        sessionId,
        sequence: audioSequenceRef.current++,
        timestamp: Date.now(),
        size: arrayBuffer.byteLength
      }

      // Send metadata as JSON
      const metadataSent = send(JSON.stringify(metadata))
      if (!metadataSent) {
        console.error('[useSimulationWebSocket] Failed to send audio metadata')
        return false
      }

      // Send binary audio data
      const dataSent = send(arrayBuffer)
      if (!dataSent) {
        console.error('[useSimulationWebSocket] Failed to send audio data')
        return false
      }

      return true

    } catch (err) {
      console.error('[useSimulationWebSocket] Error sending audio chunk:', err)
      return false
    }
  }, [isConnected, send, sessionId])

  /**
   * Subscribe to AI response events
   */
  useEffect(() => {
    const unsubscribeAI = subscribe('ai_response', (data) => {
      const response = data as AIResponseMessage

      const message: AIMessage = {
        id: `ai-${Date.now()}-${Math.random()}`,
        type: 'ai',
        content: response.content,
        timestamp: response.timestamp,
        isFinal: response.isFinal
      }

      setMessages(prev => [...prev, message])

      // Update session ID if provided
      if (response.sessionId && !sessionId) {
        setSessionId(response.sessionId)
      }
    })

    const unsubscribeStatus = subscribe('status', (data) => {
      const status = data as StatusMessage

      // Add status message to chat
      if (status.message) {
        const message: AIMessage = {
          id: `status-${Date.now()}`,
          type: 'status',
          content: status.message,
          timestamp: Date.now()
        }

        setMessages(prev => [...prev, message])
      }

      // Update session ID if provided
      if (status.sessionId && !sessionId) {
        setSessionId(status.sessionId)
      }

      // Handle error states
      if (status.state === 'error') {
        setError(status.message || 'Unknown error occurred')
      }
    })

    // Cleanup subscriptions
    return () => {
      unsubscribeAI()
      unsubscribeStatus()
    }
  }, [subscribe, sessionId])

  return {
    connect,
    disconnect,
    sendAudioChunk,
    connectionState,
    isConnected,
    messages,
    error,
    sessionId
  }
}

/**
 * Simplified hook for basic usage - auto-connects and manages lifecycle
 */
export function useSimulationWebSocketSimple(
  options: SimulationWebSocketOptions = {}
) {
  return useSimulationWebSocket({
    ...options,
    autoConnect: true
  })
}
