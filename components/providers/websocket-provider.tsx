'use client'

/**
 * WebSocketProvider - Centralized WebSocket Connection Management
 *
 * Provides a React Context for managing multiple WebSocket connections across the application.
 * Supports different connection types (simulation, notifications, etc.) with shared state management.
 *
 * Features:
 * - Multiple named connections (connection pooling)
 * - Automatic JWT authentication
 * - Centralized error handling
 * - Connection lifecycle management
 * - Message broadcasting to subscribers
 * - Auto-reconnection support
 *
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * <WebSocketProvider>
 *   {children}
 * </WebSocketProvider>
 *
 * // In components
 * const { connect, send, messages, connectionState } = useWebSocket('simulation')
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import { createWebSocketManager, type WebSocketManager, type WebSocketState } from '@/lib/websocket-utils'

// Supported WebSocket connection types
export type WebSocketConnectionType = 'simulation' | 'notifications' | 'assessments' | 'generic'

// Message interface for type safety
export interface WebSocketMessage {
  id: string
  type: string
  connectionType: WebSocketConnectionType
  data: unknown
  timestamp: number
}

// Connection configuration
export interface WebSocketConnectionConfig {
  url: string
  protocols?: string | string[]
  reconnect?: boolean
  maxReconnectAttempts?: number
  debug?: boolean
  options?: Record<string, unknown>
}

// Connection info tracked by provider
interface ConnectionInfo {
  manager: WebSocketManager
  state: WebSocketState
  messages: WebSocketMessage[]
  error: string | null
  config: WebSocketConnectionConfig
}

// Context value interface
interface WebSocketContextValue {
  // Connection management
  connect: (type: WebSocketConnectionType, config?: Partial<WebSocketConnectionConfig>) => Promise<void>
  disconnect: (type: WebSocketConnectionType) => void
  disconnectAll: () => void

  // Messaging
  send: (type: WebSocketConnectionType, data: string | ArrayBuffer | Blob) => boolean
  sendJSON: (type: WebSocketConnectionType, data: Record<string, unknown> & { type: string }) => boolean

  // State access
  getConnectionState: (type: WebSocketConnectionType) => WebSocketState
  isConnected: (type: WebSocketConnectionType) => boolean
  getMessages: (type: WebSocketConnectionType) => WebSocketMessage[]
  getError: (type: WebSocketConnectionType) => string | null

  // Event subscription
  subscribe: (type: WebSocketConnectionType, event: string, handler: (data: unknown) => void) => () => void

  // Global state
  connections: Map<WebSocketConnectionType, ConnectionInfo>
}

// Create context with undefined default
const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

// Provider props
interface WebSocketProviderProps {
  children: ReactNode
  defaultConfigs?: Partial<Record<WebSocketConnectionType, WebSocketConnectionConfig>>
  debug?: boolean
}

/**
 * WebSocketProvider Component
 */
export function WebSocketProvider({ children, defaultConfigs = {}, debug = false }: WebSocketProviderProps) {
  const [connections, setConnections] = useState<Map<WebSocketConnectionType, ConnectionInfo>>(new Map())
  const connectionsRef = useRef<Map<WebSocketConnectionType, ConnectionInfo>>(new Map())

  // Sync ref with state for immediate access
  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])

  // Default connection configurations
  const getDefaultConfig = useCallback((type: WebSocketConnectionType): WebSocketConnectionConfig | null => {
    // Check if user provided default config
    if (defaultConfigs[type]) {
      return defaultConfigs[type]!
    }

    // Environment-based defaults
    const simulationUrl = process.env.NEXT_PUBLIC_SIMULATION_WS_URL
    const notificationsUrl = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL

    switch (type) {
      case 'simulation':
        if (!simulationUrl) return null
        return {
          url: simulationUrl,
          reconnect: true,
          maxReconnectAttempts: 10,
          debug
        }

      case 'notifications':
        if (!notificationsUrl) return null
        return {
          url: notificationsUrl,
          reconnect: true,
          maxReconnectAttempts: 5,
          debug
        }

      case 'assessments':
      case 'generic':
        return null // Must be configured explicitly

      default:
        return null
    }
  }, [defaultConfigs, debug])

  // Update connection state helper
  const updateConnectionState = useCallback((type: WebSocketConnectionType, updates: Partial<ConnectionInfo>) => {
    setConnections(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(type)

      if (existing) {
        newMap.set(type, { ...existing, ...updates })
      }

      return newMap
    })
  }, [])

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async (
    type: WebSocketConnectionType,
    config?: Partial<WebSocketConnectionConfig>
  ): Promise<void> => {
    // Check if already connected
    const existing = connectionsRef.current.get(type)
    if (existing && (existing.state === 'connected' || existing.state === 'connecting')) {
      if (debug) console.log(`[WebSocketProvider] Already connected to ${type}`)
      return
    }

    // Get configuration
    const defaultConfig = getDefaultConfig(type)
    const finalConfig = { ...defaultConfig, ...config } as WebSocketConnectionConfig

    if (!finalConfig.url) {
      throw new Error(`WebSocket URL not configured for connection type: ${type}`)
    }

    if (debug) console.log(`[WebSocketProvider] Connecting to ${type}...`, finalConfig)

    try {
      // Create WebSocket manager
      const manager = createWebSocketManager({
        url: finalConfig.url,
        protocols: finalConfig.protocols,
        reconnect: finalConfig.reconnect ?? true,
        maxReconnectAttempts: finalConfig.maxReconnectAttempts ?? 10,
        debug: finalConfig.debug ?? debug
      })

      // Setup event handlers
      manager.on('stateChange', (state) => {
        updateConnectionState(type, { state: state as WebSocketState })
      })

      manager.on('message', (data) => {
        const message: WebSocketMessage = {
          id: `${type}-${Date.now()}-${Math.random()}`,
          type: 'message',
          connectionType: type,
          data,
          timestamp: Date.now()
        }

        updateConnectionState(type, {
          messages: [...(connectionsRef.current.get(type)?.messages || []), message]
        })
      })

      manager.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : 'WebSocket error'
        updateConnectionState(type, { error: errorMessage })
      })

      manager.on('connectionError', (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Connection error'
        updateConnectionState(type, { error: errorMessage })
      })

      // Store connection info
      const connectionInfo: ConnectionInfo = {
        manager,
        state: 'connecting',
        messages: [],
        error: null,
        config: finalConfig
      }

      setConnections(prev => new Map(prev).set(type, connectionInfo))

      // Initiate connection
      await manager.connect()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect'
      console.error(`[WebSocketProvider] Connection error for ${type}:`, error)

      updateConnectionState(type, {
        error: errorMessage,
        state: 'error'
      })

      throw error
    }
  }, [getDefaultConfig, updateConnectionState, debug])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback((type: WebSocketConnectionType) => {
    const connection = connectionsRef.current.get(type)

    if (connection) {
      if (debug) console.log(`[WebSocketProvider] Disconnecting from ${type}`)
      connection.manager.disconnect()

      setConnections(prev => {
        const newMap = new Map(prev)
        newMap.delete(type)
        return newMap
      })
    }
  }, [debug])

  /**
   * Disconnect all WebSocket connections
   */
  const disconnectAll = useCallback(() => {
    if (debug) console.log('[WebSocketProvider] Disconnecting all connections')

    connectionsRef.current.forEach((connection) => {
      connection.manager.disconnect()
    })

    setConnections(new Map())
  }, [debug])

  /**
   * Send data via WebSocket
   */
  const send = useCallback((type: WebSocketConnectionType, data: string | ArrayBuffer | Blob): boolean => {
    const connection = connectionsRef.current.get(type)

    if (!connection) {
      console.warn(`[WebSocketProvider] Cannot send - no connection for ${type}`)
      return false
    }

    return connection.manager.send(data)
  }, [])

  /**
   * Send JSON data via WebSocket
   * Note: data must include a 'type' property for proper routing
   */
  const sendJSON = useCallback((
    type: WebSocketConnectionType,
    data: Record<string, unknown> & { type: string }
  ): boolean => {
    const connection = connectionsRef.current.get(type)

    if (!connection) {
      console.warn(`[WebSocketProvider] Cannot send JSON - no connection for ${type}`)
      return false
    }

    return connection.manager.sendJSON(data)
  }, [])

  /**
   * Get connection state
   */
  const getConnectionState = useCallback((type: WebSocketConnectionType): WebSocketState => {
    return connectionsRef.current.get(type)?.state || 'disconnected'
  }, [])

  /**
   * Check if connected
   */
  const isConnected = useCallback((type: WebSocketConnectionType): boolean => {
    return connectionsRef.current.get(type)?.manager.isConnected() || false
  }, [])

  /**
   * Get messages for connection type
   */
  const getMessages = useCallback((type: WebSocketConnectionType): WebSocketMessage[] => {
    return connectionsRef.current.get(type)?.messages || []
  }, [])

  /**
   * Get error for connection type
   */
  const getError = useCallback((type: WebSocketConnectionType): string | null => {
    return connectionsRef.current.get(type)?.error || null
  }, [])

  /**
   * Subscribe to WebSocket events
   */
  const subscribe = useCallback((
    type: WebSocketConnectionType,
    event: string,
    handler: (data: unknown) => void
  ): (() => void) => {
    const connection = connectionsRef.current.get(type)

    if (!connection) {
      console.warn(`[WebSocketProvider] Cannot subscribe - no connection for ${type}`)
      return () => {}
    }

    connection.manager.on(event, handler)

    // Return unsubscribe function
    return () => {
      connection.manager.off(event, handler)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debug) console.log('[WebSocketProvider] Cleaning up all connections')
      connectionsRef.current.forEach((connection) => {
        connection.manager.disconnect()
      })
    }
  }, [debug])

  // Context value
  const value: WebSocketContextValue = {
    connect,
    disconnect,
    disconnectAll,
    send,
    sendJSON,
    getConnectionState,
    isConnected,
    getMessages,
    getError,
    subscribe,
    connections
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext)

  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }

  return context
}

/**
 * Convenient hook for specific WebSocket connection type
 */
export function useWebSocket(type: WebSocketConnectionType, autoConnect = false) {
  const context = useWebSocketContext()
  const [connectionState, setConnectionState] = useState<WebSocketState>('disconnected')
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  // Subscribe to state changes for reactive updates
  // Re-subscribe whenever connections map changes (connection created/destroyed)
  useEffect(() => {
    // Get current connection
    const connection = context.connections.get(type)

    if (!connection) {
      // No connection exists - set to disconnected
      setConnectionState('disconnected')
      setMessages([])
      setError(null)
      return
    }

    // Connection exists - sync initial state
    setConnectionState(connection.state)
    setMessages(connection.messages)
    setError(connection.error)

    // Subscribe to state changes
    const unsubscribeState = context.subscribe(type, 'stateChange', (state) => {
      setConnectionState(state as WebSocketState)
    })

    // Subscribe to messages
    const unsubscribeMessage = context.subscribe(type, 'message', () => {
      const conn = context.connections.get(type)
      if (conn) {
        setMessages(conn.messages)
      }
    })

    // Subscribe to errors
    const unsubscribeError = context.subscribe(type, 'error', () => {
      const conn = context.connections.get(type)
      if (conn) {
        setError(conn.error)
      }
    })

    // Cleanup subscriptions
    return () => {
      unsubscribeState()
      unsubscribeMessage()
      unsubscribeError()
    }
  }, [context, type, context.connections])

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && connectionState === 'disconnected') {
      context.connect(type).catch(err => {
        console.error(`[useWebSocket] Auto-connect failed for ${type}:`, err)
      })
    }
  }, [autoConnect, connectionState, context, type])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoConnect) {
        context.disconnect(type)
      }
    }
  }, [autoConnect, context, type])

  return {
    connect: (config?: Partial<WebSocketConnectionConfig>) => context.connect(type, config),
    disconnect: () => context.disconnect(type),
    send: (data: string | ArrayBuffer | Blob) => context.send(type, data),
    sendJSON: (data: Record<string, unknown> & { type: string }) => context.sendJSON(type, data),
    subscribe: (event: string, handler: (data: unknown) => void) => context.subscribe(type, event, handler),
    connectionState,
    isConnected: context.isConnected(type),
    messages,
    error
  }
}
