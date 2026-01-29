'use client'

import { VoiceRecorder } from '@/components/simulation/voice-recorder'

export default function SimulationPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-3xl">
        <VoiceRecorder />
      </div>
    </div>
  )
}
