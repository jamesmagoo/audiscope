"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendIcon } from "lucide-react"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export function MessageInput({ value, onChange, onSend, disabled }: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your documents, medical cases, or get assistance..."
            className="flex-1"
          />
          <Button onClick={onSend} disabled={disabled || !value.trim()} size="icon">
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}
