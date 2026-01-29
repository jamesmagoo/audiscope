'use client'

import { useRef, useEffect } from 'react'

interface AudioWaveformProps {
  analyser: AnalyserNode
}

export function AudioWaveform({ analyser }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get computed color from CSS variables
    const computedStyle = getComputedStyle(document.documentElement)
    const primaryHsl = computedStyle.getPropertyValue('--primary').trim()
    const primaryColor = `hsl(${primaryHsl})`

    // Set canvas size with high DPI support
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        const dpr = window.devicePixelRatio || 1
        const rect = container.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = 120 * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = '120px'

        ctx.scale(dpr, dpr)
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      // Get frequency data for better visualization
      analyser.getByteFrequencyData(dataArray)

      const width = canvas.width / (window.devicePixelRatio || 1)
      const height = canvas.height / (window.devicePixelRatio || 1)

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Number of bars to display
      const barCount = 60
      const barWidth = (width / barCount) - 4
      const barGap = 4

      for (let i = 0; i < barCount; i++) {
        // Sample from the frequency data
        const dataIndex = Math.floor((i * bufferLength) / barCount)
        const normalizedHeight = (dataArray[dataIndex] / 255)

        // Add minimum height and scale
        const minHeight = 4
        const barHeight = Math.max(minHeight, normalizedHeight * height * 0.8)

        const x = i * (barWidth + barGap)
        const centerY = height / 2

        // Use solid color for bars (simpler and more reliable)
        ctx.fillStyle = primaryColor

        // Top bar
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight / 2)

        // Bottom bar (mirror)
        ctx.fillRect(x, centerY, barWidth, barHeight / 2)
      }

      // Draw subtle center line
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [analyser])

  return (
    <div className="relative w-full rounded-lg border border-border/30 bg-background/30 p-4 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
