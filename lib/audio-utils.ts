/**
 * Audio Utilities for AI Audio Streaming
 *
 * Handles MP3 decoding, audio buffering, and real-time playback
 * for AI responses in the simulation feature.
 */

/**
 * Converts base64-encoded audio to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Decodes MP3 audio data to AudioBuffer
 */
export async function decodeMP3(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> {
  try {
    return await audioContext.decodeAudioData(arrayBuffer)
  } catch (error) {
    console.error('[AudioUtils] Failed to decode MP3:', error)
    throw new Error('Failed to decode audio chunk')
  }
}

/**
 * Audio chunk to be queued for playback
 */
interface AudioChunk {
  sequence: number
  buffer: AudioBuffer
}

/**
 * Audio Queue Manager
 *
 * Manages buffering and sequential playback of audio chunks.
 * Ensures smooth, gap-free playback by buffering chunks before starting.
 */
export class AudioQueue {
  private audioContext: AudioContext
  private analyser: AnalyserNode
  private chunks: AudioChunk[] = []
  private currentSource: AudioBufferSourceNode | null = null
  private isPlaying = false
  private playbackStartTime = 0
  private totalDuration = 0
  private minBufferChunks = 3 // Buffer first 3 chunks before starting
  private onComplete?: () => void
  private hasStartedPlayback = false

  constructor(
    audioContext: AudioContext,
    analyser: AnalyserNode,
    onComplete?: () => void
  ) {
    this.audioContext = audioContext
    this.analyser = analyser
    this.onComplete = onComplete
  }

  /**
   * Add an audio chunk to the queue
   * Automatically starts playback once minimum buffer is reached
   */
  addChunk(sequence: number, buffer: AudioBuffer) {
    console.log(`[AudioQueue] Adding chunk ${sequence}, duration: ${buffer.duration.toFixed(2)}s`)

    this.chunks.push({ sequence, buffer })

    // Sort chunks by sequence to handle out-of-order delivery
    this.chunks.sort((a, b) => a.sequence - b.sequence)

    // Start playback if we have minimum buffer and haven't started yet
    if (!this.hasStartedPlayback && this.chunks.length >= this.minBufferChunks) {
      console.log(`[AudioQueue] Starting playback with ${this.chunks.length} chunks buffered`)
      this.hasStartedPlayback = true
      this.playNextChunk()
    }
  }

  /**
   * Play the next chunk in the queue
   */
  private playNextChunk() {
    if (this.chunks.length === 0) {
      console.log('[AudioQueue] No more chunks to play')
      this.isPlaying = false

      // Call completion callback if set
      if (this.onComplete) {
        this.onComplete()
      }
      return
    }

    // Get the next chunk
    const chunk = this.chunks.shift()!

    console.log(`[AudioQueue] Playing chunk ${chunk.sequence}, remaining: ${this.chunks.length}`)

    // Create source node
    const source = this.audioContext.createBufferSource()
    source.buffer = chunk.buffer

    // Connect to analyser for waveform visualization
    source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)

    this.currentSource = source
    this.isPlaying = true

    // When this chunk finishes, play the next one
    source.onended = () => {
      console.log(`[AudioQueue] Chunk ${chunk.sequence} finished`)
      this.currentSource = null

      // Small delay before next chunk to ensure smooth transition
      setTimeout(() => {
        this.playNextChunk()
      }, 10)
    }

    // Start playback
    const now = this.audioContext.currentTime
    source.start(now)

    this.totalDuration += chunk.buffer.duration
  }

  /**
   * Signal that all chunks have been received
   * Continue playing buffered chunks
   */
  finalize() {
    console.log(`[AudioQueue] Finalized with ${this.chunks.length} remaining chunks`)

    // If we haven't started yet (received fewer than min buffer), start now
    if (!this.hasStartedPlayback && this.chunks.length > 0) {
      console.log('[AudioQueue] Starting playback with partial buffer on finalize')
      this.hasStartedPlayback = true
      this.playNextChunk()
    }
  }

  /**
   * Stop playback and clear queue
   */
  stop() {
    console.log('[AudioQueue] Stopping playback')

    if (this.currentSource) {
      try {
        this.currentSource.stop()
        this.currentSource.disconnect()
      } catch (error) {
        // Ignore errors if already stopped
        console.log('[AudioQueue] Error stopping source (may already be stopped):', error)
      }
      this.currentSource = null
    }

    this.chunks = []
    this.isPlaying = false
    this.hasStartedPlayback = false
    this.totalDuration = 0
  }

  /**
   * Get current playback status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.chunks.length,
      totalDuration: this.totalDuration,
      hasStarted: this.hasStartedPlayback
    }
  }
}
