/**
 * Simulation API Service
 *
 * This service handles real-time voice conversation with AI for medical simulation training.
 *
 * BACKEND ENDPOINT REQUIRED:
 * The backend needs to implement a new endpoint for simulation conversations.
 * This is separate from the existing audio pipeline (audio-pipeline-api.service.ts)
 * which handles assessment transcription and analysis.
 *
 * Expected Backend Requirements:
 * - Real-time or near-real-time audio processing
 * - Streaming responses for low-latency conversation
 * - WebSocket support (recommended) or HTTP streaming
 * - Audio format: WebM (from browser MediaRecorder)
 * - Response format: Text or audio response from AI
 */

import { makeAuthenticatedRequest, handleApiResponse } from './api-utils'
import { createWebSocketManager, type WebSocketManager } from './websocket-utils'

// WebSocket URL from environment (added to .env files)
const SIMULATION_WS_URL = process.env.NEXT_PUBLIC_SIMULATION_WS_URL || ''

// TODO: Add this to environment variables when backend is ready (HTTP fallback)
const SIMULATION_API_URL = process.env.NEXT_PUBLIC_SIMULATION_API_URL || ''

/**
 * Audio conversation request
 */
export interface SimulationRequest {
  audioBlob: Blob
  duration: number // Recording duration in seconds
  sessionId?: string // Optional session ID for multi-turn conversations
  context?: {
    scenario?: string // Medical scenario context
    role?: string // User's role in simulation
    difficulty?: string // Simulation difficulty level
  }
}

/**
 * AI response from simulation
 */
export interface SimulationResponse {
  sessionId: string
  transcript: string // User's speech transcribed
  aiResponse: string // AI's text response
  audioResponse?: string // Optional: URL to AI's audio response
  timestamp: string
  metadata?: {
    confidence?: number
    processingTime?: number
  }
}

/**
 * Session information
 */
export interface SimulationSession {
  sessionId: string
  startTime: string
  scenario?: string
  turnCount: number
  status: 'active' | 'completed' | 'failed'
}

/**
 * Submit audio for AI conversation
 *
 * @param request - Audio data and conversation context
 * @returns AI response with transcription and reply
 *
 * NOTE: Backend endpoint not yet implemented
 * When ready, this should call: POST /api/simulation/conversation
 */
export async function submitSimulationAudio(
  request: SimulationRequest
): Promise<SimulationResponse> {
  // TODO: Implement when backend endpoint is ready
  console.log('[SIMULATION API] submitSimulationAudio called (backend not implemented)', {
    audioBlobSize: request.audioBlob.size,
    audioBlobType: request.audioBlob.type,
    duration: request.duration,
    sessionId: request.sessionId,
    context: request.context,
  })

  // Placeholder response for development
  throw new Error(
    'Simulation API endpoint not yet implemented. ' +
    'Backend needs to provide POST /api/simulation/conversation endpoint.'
  )

  /* EXAMPLE IMPLEMENTATION WHEN BACKEND IS READY:

  const formData = new FormData()
  formData.append('audio', request.audioBlob, 'recording.webm')
  formData.append('duration', request.duration.toString())

  if (request.sessionId) {
    formData.append('sessionId', request.sessionId)
  }

  if (request.context) {
    formData.append('context', JSON.stringify(request.context))
  }

  const response = await makeAuthenticatedRequest(
    `${SIMULATION_API_URL}/simulation/conversation`,
    {
      method: 'POST',
      body: formData,
      headers: {
        // Note: Don't set Content-Type for FormData, browser sets it with boundary
      }
    }
  )

  return handleApiResponse(response)
  */
}

/**
 * Start a new simulation session
 *
 * @param scenario - Optional scenario configuration
 * @returns Session information
 *
 * NOTE: Backend endpoint not yet implemented
 */
export async function startSimulationSession(
  scenario?: string
): Promise<SimulationSession> {
  console.log('[SIMULATION API] startSimulationSession called (backend not implemented)', {
    scenario,
  })

  throw new Error('Simulation API endpoint not yet implemented')

  /* EXAMPLE IMPLEMENTATION:

  const response = await makeAuthenticatedRequest(
    `${SIMULATION_API_URL}/simulation/session`,
    {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }
  )

  return handleApiResponse(response)
  */
}

/**
 * Get conversation history for a session
 *
 * @param sessionId - Session ID
 * @returns Array of conversation turns
 */
export async function getSimulationHistory(
  sessionId: string
): Promise<SimulationResponse[]> {
  console.log('[SIMULATION API] getSimulationHistory called (backend not implemented)', {
    sessionId,
  })

  throw new Error('Simulation API endpoint not yet implemented')

  /* EXAMPLE IMPLEMENTATION:

  const response = await makeAuthenticatedRequest(
    `${SIMULATION_API_URL}/simulation/session/${sessionId}/history`
  )

  return handleApiResponse(response)
  */
}

/**
 * End a simulation session
 *
 * @param sessionId - Session ID to end
 */
export async function endSimulationSession(
  sessionId: string
): Promise<void> {
  console.log('[SIMULATION API] endSimulationSession called (backend not implemented)', {
    sessionId,
  })

  throw new Error('Simulation API endpoint not yet implemented')

  /* EXAMPLE IMPLEMENTATION:

  const response = await makeAuthenticatedRequest(
    `${SIMULATION_API_URL}/simulation/session/${sessionId}`,
    {
      method: 'DELETE',
    }
  )

  await handleApiResponse(response)
  */
}

/**
 * Message types for WebSocket communication
 */
export interface AudioChunkMessage {
  type: 'audio_chunk'
  sessionId?: string
  sequence: number
  timestamp: number
  data: ArrayBuffer
  [key: string]: unknown
}

export interface AIResponseMessage {
  type: 'ai_response'
  sessionId: string
  content: string
  isFinal: boolean
  timestamp: number
  [key: string]: unknown
}

export interface StatusMessage {
  type: 'status'
  state: 'connected' | 'processing' | 'error'
  message?: string
  sessionId?: string
  [key: string]: unknown
}

export interface SessionJoinMessage {
  type: 'join'
  sessionId?: string
  scenario?: string
  role?: string
  [key: string]: unknown
}

export type SimulationWSMessage = AudioChunkMessage | AIResponseMessage | StatusMessage | SessionJoinMessage

/**
 * WebSocket connection for real-time streaming (RECOMMENDED APPROACH)
 *
 * For low-latency conversations, uses WebSocket for bi-directional streaming
 * to enable natural conversation flow.
 *
 * Example usage:
 *
 * const wsManager = createSimulationWebSocket()
 * await wsManager.connect()
 *
 * wsManager.on('ai_response', (data) => {
 *   console.log('AI said:', data.content)
 * })
 *
 * // Send audio chunk
 * wsManager.send(audioBlob)
 *
 * @param options - WebSocket configuration options
 * @returns WebSocketManager instance
 */
export function createSimulationWebSocket(options?: {
  sessionId?: string
  scenario?: string
  role?: string
  debug?: boolean
}): WebSocketManager {
  if (!SIMULATION_WS_URL) {
    throw new Error(
      'NEXT_PUBLIC_SIMULATION_WS_URL not configured. ' +
      'Please add WebSocket URL to your .env file.'
    )
  }

  console.log('[SIMULATION API] Creating WebSocket connection', {
    sessionId: options?.sessionId,
    scenario: options?.scenario,
    role: options?.role,
  })

  // Create managed WebSocket with auto-reconnection
  const wsManager = createWebSocketManager({
    url: SIMULATION_WS_URL,
    reconnect: true,
    maxReconnectAttempts: 10,
    maxReconnectDelay: 30000,
    debug: options?.debug || false
  })

  // Send join message when connected
  wsManager.on('connected', () => {
    console.log('[SIMULATION API] WebSocket connected, sending join message')

    const joinMessage: SessionJoinMessage = {
      type: 'join',
      sessionId: options?.sessionId,
      scenario: options?.scenario,
      role: options?.role
    }

    wsManager.sendJSON(joinMessage)
  })

  // Log connection errors
  wsManager.on('error', (error) => {
    console.error('[SIMULATION API] WebSocket error:', error)
  })

  // Log disconnections
  wsManager.on('disconnected', (data: unknown) => {
    const disconnectData = data as { code: number; reason: string }
    console.log('[SIMULATION API] WebSocket disconnected', disconnectData)
  })

  return wsManager
}

/**
 * Helper to send audio chunk via WebSocket
 *
 * @param wsManager - WebSocket manager instance
 * @param audioBlob - Audio data to send
 * @param sequence - Sequence number for ordering
 * @param sessionId - Optional session ID
 */
export async function sendAudioChunk(
  wsManager: WebSocketManager,
  audioBlob: Blob,
  sequence: number,
  sessionId?: string
): Promise<boolean> {
  if (!wsManager.isConnected()) {
    console.warn('[SIMULATION API] Cannot send audio chunk - not connected')
    return false
  }

  // Convert Blob to ArrayBuffer
  const arrayBuffer = await audioBlob.arrayBuffer()

  // Create message metadata (will be sent as separate JSON message before binary data)
  const metadata = {
    type: 'audio_chunk',
    sessionId,
    sequence,
    timestamp: Date.now(),
    size: arrayBuffer.byteLength
  }

  // Send metadata as JSON
  const metadataSent = wsManager.sendJSON(metadata)
  if (!metadataSent) {
    console.error('[SIMULATION API] Failed to send audio metadata')
    return false
  }

  // Send binary audio data
  const dataSent = wsManager.send(arrayBuffer)
  if (!dataSent) {
    console.error('[SIMULATION API] Failed to send audio data')
    return false
  }

  console.log('[SIMULATION API] Sent audio chunk', {
    sequence,
    size: arrayBuffer.byteLength,
    sessionId
  })

  return true
}
