'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AudioWaveform } from './audio-waveform'
import { useSimpleWebSocket } from '@/hooks/use-simple-websocket'
import { createSimulationSession } from '@/lib/simulation-api.service'
import { useProducts } from '@/hooks/use-products'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type RecordingState = 'idle' | 'recording' | 'processing'
type SessionState = 'idle' | 'creating' | 'ready' | 'error'

export function VoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isAnalyserReady, setIsAnalyserReady] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string>('none')

  // Fetch products for selection
  const { data: products, isLoading: isLoadingProducts } = useProducts('active')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioSequenceRef = useRef(0)
  const hasInitializedSessionRef = useRef(false)

  // WebSocket connection - ONLY connect if we have a session ID
  const baseUrl = process.env.NEXT_PUBLIC_SIMULATION_WS_URL || 'ws://localhost:5002/api/v1/simulations'
  const wsUrl = sessionId ? `${baseUrl}/${sessionId}/stream` : null

  const {
    send: sendWS,
    isConnected: isWSConnected,
    connectionState,
    error: wsError,
    subscribe
  } = useSimpleWebSocket({
    url: wsUrl || '', // Empty string prevents connection until session created
    debug: true,
    reconnect: true,
    maxReconnectAttempts: 10
  })

  // Create session when product is selected
  const handleCreateSession = async () => {
    // Prevent duplicate session creation (React StrictMode guard)
    if (hasInitializedSessionRef.current) {
      console.log('[VoiceRecorder] Session already initialized - skipping')
      return
    }

    hasInitializedSessionRef.current = true

    try {
      setSessionState('creating')
      setError(null)

      console.log('[VoiceRecorder] Creating simulation session...')

      const sessionRequest: any = {
        simulation_type: 'scenario_based',
        scenario_prompt: selectedProductId === 'none'
          ? 'General medical scenario training'
          : `Product demonstration and training`,
      }

      // Only include product_id if a product is selected
      if (selectedProductId !== 'none') {
        sessionRequest.product_id = selectedProductId
      }

      const response = await createSimulationSession(sessionRequest)

      console.log('[VoiceRecorder] Session created:', response.session_id)
      setSessionId(response.session_id)
      setSessionState('ready')
    } catch (err) {
      console.error('[VoiceRecorder] Failed to create session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create simulation session')
      setSessionState('error')
      hasInitializedSessionRef.current = false // Allow retry on error
    }
  }

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      console.log('[VoiceRecorder] Unmounting - cleanup')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync error state from WebSocket
  useEffect(() => {
    if (wsError) {
      setError(wsError)
    }
  }, [wsError])

  // Subscribe to audio_processed messages from server
  useEffect(() => {
    const unsubscribe = subscribe('audio_processed', (data: unknown) => {
      const message = data as { payload: { turn_number: number; audio_url: string; status: string } }
      console.log('[VoiceRecorder] Audio processed:', message.payload)

      // Reset to idle state after server confirms processing
      setRecordingState('idle')

      // Reset sequence counter for next turn
      audioSequenceRef.current = 0

      // Could show turn number or status to user here
      console.log(`Turn ${message.payload.turn_number} saved: ${message.payload.status}`)
    })

    return unsubscribe
  }, [subscribe])

  useEffect(() => {
    console.log('Timer state changed:', recordingTime, 'Recording:', recordingState)
  }, [recordingTime, recordingState])

  const startRecording = async () => {
    try {
      console.log('=== START RECORDING ===')
      setError(null)

      // Verify WebSocket is connected before proceeding
      if (!isWSConnected) {
        setError('WebSocket not connected. Please wait for connection.')
        return
      }

      // Request microphone access
      console.log('Requesting microphone access...')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      console.log('Microphone access granted')
      setStream(mediaStream)

      // Create Web Audio API context for waveform visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(mediaStream)

      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      setIsAnalyserReady(true)

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log('Data available:', event.data.size, 'bytes')

          // Stream audio chunk to WebSocket in base64 format (core-API spec)
          if (isWSConnected) {
            try {
              // Convert Blob to ArrayBuffer then to base64
              const arrayBuffer = await event.data.arrayBuffer()
              const uint8Array = new Uint8Array(arrayBuffer)
              const base64Chunk = btoa(String.fromCharCode(...uint8Array))

              // Send as single JSON message per core-API spec
              const message = {
                type: 'audio_chunk',
                payload: {
                  chunk: base64Chunk,
                  sequence: audioSequenceRef.current++,
                  format: 'webm'
                }
              }

              const sent = sendWS(JSON.stringify(message))
              if (!sent) {
                console.warn('Failed to send audio chunk')
              } else {
                console.log('Sent audio chunk', message.payload.sequence, base64Chunk.length, 'bytes (base64)')
              }
            } catch (err) {
              console.error('Error sending audio chunk:', err)
            }
          } else {
            console.warn('WebSocket not connected, dropping audio chunk')
          }
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
      }

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped - Duration was:', recordingTime)
        setRecordingState('processing')

        // Send audio_complete signal to server (core-API spec)
        if (isWSConnected) {
          console.log('Sending audio_complete signal')
          sendWS(JSON.stringify({ type: 'audio_complete' }))
        }

        // Cleanup audio context (may already be closed by stopRecording)
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          console.log('Closing audio context in onstop')
          await audioContextRef.current.close()
          audioContextRef.current = null
        }

        // Cleanup stream (may already be stopped by stopRecording)
        if (stream && stream.active) {
          console.log('Stopping stream tracks in onstop')
          stream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
              track.stop()
              console.log('Track stopped in onstop:', track.kind)
            }
          })
          setStream(null)
        }

        // Reset state
        setRecordingState('idle')
        setRecordingTime(0)
        setIsAnalyserReady(false)
      }

      mediaRecorderRef.current = mediaRecorder

      console.log('MediaRecorder state before start:', mediaRecorder.state)
      mediaRecorder.start(100) // Collect data every 100ms
      console.log('MediaRecorder state after start:', mediaRecorder.state)

      setRecordingState('recording')
      setRecordingTime(0) // Reset timer

      // Start timer
      console.log('Starting timer...')
      timerIntervalRef.current = setInterval(() => {
        console.log('Timer tick')
        setRecordingTime((prev) => {
          const newTime = prev + 1
          console.log('Recording time:', newTime)
          return newTime
        })
      }, 1000)

      console.log('Timer interval ID:', timerIntervalRef.current)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access microphone. Please check permissions.'
      )
      setRecordingState('idle')
      setIsAnalyserReady(false)

      // Cleanup any partially created resources
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }

  const stopRecording = () => {
    console.log('=== STOP RECORDING CALLED ===')
    console.log('Current state:', recordingState)
    console.log('MediaRecorder exists:', !!mediaRecorderRef.current)
    console.log('MediaRecorder state:', mediaRecorderRef.current?.state)

    if (mediaRecorderRef.current && recordingState === 'recording') {
      console.log('Stopping MediaRecorder...')
      mediaRecorderRef.current.stop()

      if (timerIntervalRef.current) {
        console.log('Clearing timer interval')
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }

      // Stop the stream tracks immediately (don't wait for onstop)
      if (stream) {
        console.log('Stopping stream tracks immediately')
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('Track stopped immediately:', track.kind)
        })
        setStream(null)
      }

      // Close audio context immediately
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('Closing audio context immediately')
        audioContextRef.current.close()
        audioContextRef.current = null
        analyserRef.current = null
      }

      setIsAnalyserReady(false)
    } else {
      console.log('Not stopping - conditions not met')
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getConnectionBadge = () => {
    // Show session creation state first
    if (sessionState === 'creating') {
      return (
        <Badge variant="secondary" className="gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Creating Session...
        </Badge>
      )
    }

    if (sessionState === 'error') {
      return (
        <Badge variant="destructive" className="gap-1.5">
          <AlertCircle className="h-3 w-3" />
          Session Error
        </Badge>
      )
    }

    // Then show WebSocket connection state
    switch (connectionState) {
      case 'connected':
        return (
          <Badge variant="default" className="gap-1.5">
            <Wifi className="h-3 w-3" />
            Connected
          </Badge>
        )
      case 'connecting':
        return (
          <Badge variant="secondary" className="gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting...
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1.5">
            <WifiOff className="h-3 w-3" />
            Connection Error
          </Badge>
        )
      case 'disconnected':
        return (
          <Badge variant="outline" className="gap-1.5">
            <WifiOff className="h-3 w-3" />
            Disconnected
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
      {/* Product Selection - Show only if session not created yet */}
      {sessionState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="product-select">Select a Product (Optional)</Label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={isLoadingProducts}
            >
              <SelectTrigger id="product-select" className="w-full">
                <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "No product (general training)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No product (general training)</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedProductId === 'none'
                ? "You'll practice general medical scenarios"
                : "You'll practice discussing this specific product"}
            </p>
          </div>

          <Button
            onClick={handleCreateSession}
            disabled={isLoadingProducts}
            className="w-full"
          >
            {isLoadingProducts ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Products...
              </>
            ) : (
              'Start Simulation Session'
            )}
          </Button>
        </motion.div>
      )}

      {/* Connection Status - Show after session creation starts */}
      {sessionState !== 'idle' && (
        <div className="flex items-center gap-2">
          {getConnectionBadge()}
        </div>
      )}

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-2xl"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Flip Card Container - Show only after session creation */}
      {sessionState !== 'idle' && (
        <div className="relative w-full max-w-2xl h-[450px]" style={{ perspective: '1500px' }}>

        {/* The Actual Card that Flips */}
        <motion.div
          className="relative w-full h-full"
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

          {/* FRONT SIDE - Idle/Start Recording */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              transformStyle: 'preserve-3d'
            }}
          >
              <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-xl w-full max-w-xl min-h-[400px] p-8">
                <div className="flex flex-col items-center justify-center space-y-6 h-full">
                  {/* Title */}
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                      AI Simulation
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Click to begin voice conversation
                    </p>
                  </div>

                  {/* AI Messages - Coming soon */}

                  {/* Start Button */}
                  <Button
                    size="lg"
                    onClick={startRecording}
                    disabled={sessionState !== 'ready' || connectionState !== 'connected'}
                    className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                  >
                    {sessionState === 'creating' || connectionState === 'connecting' ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </div>
          </div>

          {/* BACK SIDE - Recording/Active */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-xl w-full max-w-xl min-h-[400px] p-8">
              <div className="flex flex-col items-center justify-center space-y-4 h-full">
                {/* Timer */}
                <div className="text-center space-y-2">
                  <div className="text-5xl font-mono font-bold tracking-tight tabular-nums">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground justify-center">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                    <span>Recording</span>
                  </div>
                </div>

                {/* Waveform */}
                {recordingState === 'recording' && isAnalyserReady && analyserRef.current && (
                  <div className="w-full">
                    <AudioWaveform analyser={analyserRef.current} />
                  </div>
                )}

                {/* Stop Button */}
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Square className="h-5 w-5 fill-current" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}

      {/* Processing State - Overlay */}
      <AnimatePresence>
        {recordingState === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
          >
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <h2 className="text-3xl font-bold">Processing...</h2>
              <p className="text-muted-foreground">Analyzing your audio</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
