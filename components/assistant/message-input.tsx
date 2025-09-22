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
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Ask about your assessments, training protocols, or clinical procedures..." 
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

  const canSend = (message.trim().length > 0 || attachedFiles.length > 0) && !disabled

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
      <form onSubmit={handleSubmit} className="p-4">
        <div className="relative flex items-end gap-3">
          {/* File attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 flex-shrink-0 self-end"
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

          {/* Message textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[60px] max-h-[200px] resize-none pr-12",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
              rows={1}
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}/4000
            </div>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            size="sm"
            className={cn(
              "h-10 w-10 p-0 flex-shrink-0 self-end transition-all",
              canSend ? "bg-primary hover:bg-primary/90" : "bg-muted"
            )}
            disabled={!canSend}
          >
            {disabled ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Helpful tips */}
        <div className="mt-2 text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> for new line
        </div>
      </form>
    </div>
  )
}