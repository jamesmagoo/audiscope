'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, AlertCircle, Wifi, WifiOff, Send, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AudioWaveform } from './audio-waveform'
import { useSimulationWebSocket } from '@/hooks/use-simulation-websocket'
import { useWebSocket } from '@/components/providers/websocket-provider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RecordingState = 'idle' | 'recording' | 'processing'

export function VoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isAnalyserReady, setIsAnalyserReady] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // WebSocket connection for streaming
  const {
    connect: connectWS,
    disconnect: disconnectWS,
    sendAudioChunk,
    connectionState,
    isConnected: isWSConnected,
    messages: aiMessages,
    error: wsError
  } = useSimulationWebSocket({
    debug: true
  })

  // Test WebSocket connection (for learning/debugging)
  const {
    connect: connectTest,
    disconnect: disconnectTest,
    sendJSON: sendTestJSON,
    subscribe: subscribeTest,
    connectionState: testConnectionState,
    isConnected: isTestConnected,
    error: testError
  } = useWebSocket('generic')

  const [testResponse, setTestResponse] = useState<string | null>(null)
  const [lastPingSent, setLastPingSent] = useState<Date | null>(null)
  const [testSessionId] = useState<string>(() => `test-${Date.now()}`)

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('Component unmounting - cleanup')
      if (timerIntervalRef.current) {
        console.log('Cleanup: Clearing timer')
        clearInterval(timerIntervalRef.current)
      }
      if (stream) {
        console.log('Cleanup: Stopping stream tracks')
        stream.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('Cleanup: Closing audio context')
        audioContextRef.current.close()
      }
      // Disconnect WebSocket
      disconnectWS()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync error state from WebSocket
  useEffect(() => {
    if (wsError) {
      setError(wsError)
    }
  }, [wsError])

  // Subscribe to pong messages from test connection
  useEffect(() => {
    const unsubscribe = subscribeTest('pong', (data) => {
      console.log('[TEST] Received pong:', data)
      const pongData = data as { type: string; session_id?: string; timestamp?: string }
      const latency = lastPingSent ? Date.now() - lastPingSent.getTime() : 0
      setTestResponse(`Pong received! Session: ${pongData.session_id || 'unknown'} (${latency}ms latency)`)
    })

    return unsubscribe
  }, [subscribeTest, lastPingSent])

  // Test WebSocket handlers
  const handleTestConnect = async () => {
    try {
      setTestResponse(null)
      console.log('[TEST] Connecting to test WebSocket...')
      console.log('[TEST] Session ID:', testSessionId)

      // Connect to Core API simulation endpoint with session ID
      const baseUrl = process.env.NEXT_PUBLIC_TEST_WS_URL || 'ws://localhost:5002/api/v1/simulations'
      const wsUrl = `${baseUrl}/${testSessionId}/stream`

      await connectTest({
        url: wsUrl,
        debug: true
      })

      setTestResponse(`Connected to session: ${testSessionId}. Ready to send ping.`)
    } catch (err) {
      console.error('[TEST] Connection failed:', err)
      setTestResponse(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleTestDisconnect = () => {
    console.log('[TEST] Disconnecting...')
    disconnectTest()
    setTestResponse(null)
    setLastPingSent(null)
  }

  const handleSendPing = () => {
    if (!isTestConnected) {
      setTestResponse('Not connected! Click "Connect Test" first.')
      return
    }

    console.log('[TEST] Sending ping...')
    const now = new Date()
    setLastPingSent(now)

    // Send ping message with ISO 8601 timestamp format
    const success = sendTestJSON({
      type: 'ping',
      timestamp: now.toISOString()
    })

    if (success) {
      setTestResponse('Ping sent! Waiting for pong...')
    } else {
      setTestResponse('Failed to send ping. Check connection.')
    }
  }

  // Debug timer
  useEffect(() => {
    console.log('Timer state changed:', recordingTime, 'Recording:', recordingState)
  }, [recordingTime, recordingState])

  const startRecording = async () => {
    try {
      console.log('=== START RECORDING ===')
      setError(null)

      // Connect WebSocket if not already connected
      if (!isWSConnected && connectionState !== 'connecting') {
        console.log('Connecting to WebSocket...')
        await connectWS()
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

          // Stream audio chunk to WebSocket (instead of storing in memory)
          if (isWSConnected) {
            try {
              const success = await sendAudioChunk(event.data)
              if (!success) {
                console.warn('Failed to send audio chunk via WebSocket')
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

        // No need to create blob - chunks were streamed via WebSocket
        console.log('Recording completed - audio streamed to WebSocket')

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

  const getStatusBadge = () => {
    switch (recordingState) {
      case 'recording':
        return (
          <Badge variant="destructive" className="animate-pulse">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-white" />
            Recording
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            Ready
          </Badge>
        )
    }
  }

  const getConnectionBadge = () => {
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
      {/* WebSocket Test Panel (for learning/debugging) */}
      <Card className="w-full max-w-2xl border-dashed hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            WebSocket Test - Ping/Pong
          </CardTitle>
          <CardDescription>
            Test WebSocket connection flow: Connect → Send Ping → Receive Pong
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connection:</span>
            <Badge
              variant={
                testConnectionState === 'connected'
                  ? 'default'
                  : testConnectionState === 'connecting'
                  ? 'secondary'
                  : testConnectionState === 'error'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {testConnectionState === 'connected' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {testConnectionState === 'connecting' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {testConnectionState === 'connected' ? 'Connected' : testConnectionState}
            </Badge>
          </div>

          {/* Test Response */}
          {testResponse && (
            <Alert>
              <AlertDescription className="font-mono text-xs">
                {testResponse}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Error */}
          {testError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isTestConnected ? (
              <Button onClick={handleTestConnect} disabled={testConnectionState === 'connecting'} className="flex-1">
                {testConnectionState === 'connecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Connect Test
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={handleSendPing} variant="default" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send Ping
                </Button>
                <Button onClick={handleTestDisconnect} variant="outline">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-semibold">Backend Setup:</p>
            <code className="block bg-muted p-2 rounded text-[10px]">
              Endpoint: ws://localhost:5002/api/v1/simulations/{'{session-id}'}/stream
              <br />
              Ping: {`{ type: "ping", timestamp: "2026-01-28T10:00:00Z" }`}
              <br />
              Pong: {`{ type: "pong", session_id: "...", timestamp: "..." }`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {getConnectionBadge()}
      </div>

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

      {/* 3D Flip Card Container */}
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

                  {/* AI Messages (if any) */}
                  {aiMessages.length > 0 && (
                    <ScrollArea className="w-full max-h-[200px] rounded-lg border border-border/30 bg-background/50 p-4">
                      <div className="space-y-3">
                        {aiMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`text-sm ${
                              message.type === 'ai'
                                ? 'text-foreground'
                                : message.type === 'status'
                                ? 'text-muted-foreground italic'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span className="font-semibold">
                              {message.type === 'ai' ? 'AI: ' : message.type === 'status' ? 'Status: ' : 'You: '}
                            </span>
                            {message.content}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Start Button */}
                  <Button
                    size="lg"
                    onClick={startRecording}
                    disabled={connectionState === 'connecting'}
                    className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                  >
                    {connectionState === 'connecting' ? (
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
