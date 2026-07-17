"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  onStop?: () => void
  /** Fires when the user focuses/blurs the input — lets the view show a "listening" state. */
  onComposingChange?: (composing: boolean) => void
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Ask about your assessments, training protocols, or clinical procedures...",
  isStreaming = false,
  onStop,
  onComposingChange
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isStreaming) return
    if (message.trim() || attachedFiles.length > 0) {
      onSendMessage(message.trim(), attachedFiles)
      setMessage("")
      setAttachedFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow new line on Shift+Enter
        return
      } else {
        e.preventDefault()
        handleSubmit()
      }
    }
  }

  const handleFileAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const canSend = (message.trim().length > 0 || attachedFiles.length > 0) && !disabled && !isStreaming

  return (
    <div className="border-t border-border bg-background">
      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-muted-foreground text-xs">({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 pt-3">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-background p-2 pl-4 shadow-sm",
            "transition-shadow focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
          )}
        >
          {/* File attachment button (hidden until uploads are supported) */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 flex-shrink-0 self-end hidden"
            onClick={handleFileAttachment}
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => onComposingChange?.(true)}
            onBlur={() => onComposingChange?.(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[40px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-1 shadow-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            )}
            rows={1}
          />

          {/* Send / stop button */}
          {isStreaming ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-9 w-9 flex-shrink-0 rounded-xl p-0"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              variant="default"
              className="h-9 w-9 flex-shrink-0 rounded-xl p-0 transition-all disabled:opacity-40"
              disabled={!canSend}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded bg-muted px-1 py-0.5">Enter</kbd> to send ·{" "}
            <kbd className="rounded bg-muted px-1 py-0.5">Shift+Enter</kbd> for a new line
          </span>
          <span className={cn(message.length > 3800 && "text-destructive")}>
            {message.length}/4000
          </span>
        </div>
      </form>
    </div>
  )
}