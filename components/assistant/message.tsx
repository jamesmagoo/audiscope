"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Bot } from "lucide-react"
import { MessageResponse } from "@/components/ai-elements/message"
import { Persona, type PersonaState } from "@/components/ai-elements/persona"
import { ThinkingShimmer } from "./thinking-shimmer"

export interface MessageType {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  isLoading?: boolean
  isStreaming?: boolean
}

interface MessageProps {
  message: MessageType
  /** Animate entrance — pass true only for messages that appear live, not loaded history. */
  animateIn?: boolean
  /** Render the animated Persona orb as the avatar (the view passes this for
      the latest assistant message only — one WebGL canvas at a time). */
  personaAvatar?: boolean
  /** Orb state for the settled avatar (e.g. "listening" while composing,
      "asleep" on error). Live thinking/speaking come from the message. */
  personaIdleState?: PersonaState
}

function formatMessageTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Message({
  message,
  animateIn = false,
  personaAvatar = false,
  personaIdleState = "idle",
}: MessageProps) {
  const [copied, setCopied] = useState(false)
  const reducedMotion = useReducedMotion()
  const shouldAnimate = animateIn && !reducedMotion

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const isUser = message.sender === "user"

  if (isUser) {
    return (
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 12, scale: 0.98 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
        className="flex justify-end px-4 py-1.5"
      >
        <div className="group flex max-w-[80%] md:max-w-[70%] flex-col items-end gap-1">
          <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="pr-1 text-[10px] text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    )
  }

  // Thinking bubble: orb avatar (thinking state) + shimmer text.
  if (message.isLoading) {
    return (
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
        className="flex items-center gap-3 px-4 py-2.5"
      >
        <div className="h-8 w-8 flex-shrink-0">
          <Persona state="thinking" variant="opal" className="h-full w-full" />
        </div>
        <ThinkingShimmer />
      </motion.div>
    )
  }

  // The latest assistant message keeps the animated orb (speaking -> idle in
  // place); older messages use the static icon so only one WebGL canvas is live.
  const showOrb = personaAvatar || message.isStreaming

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
      className="group flex gap-3 px-4 py-2.5"
    >
      {/* Avatar — column height matches the first text line's line-height so
          the orb/icon centre aligns with the middle of the first line. */}
      {showOrb ? (
        <div className="flex h-[1.625em] w-8 flex-shrink-0 items-center text-sm">
          <Persona
            state={message.isStreaming ? "speaking" : personaIdleState}
            variant="opal"
            className="h-8 w-8"
          />
        </div>
      ) : (
        <div className="flex h-[1.625em] w-8 flex-shrink-0 items-center text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-sm">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className="min-w-0 max-w-[85%] flex-1 md:max-w-[75%]">
        <div className="text-sm leading-relaxed">
          {/* Streamdown-based renderer: streaming-tolerant markdown parsing,
              GFM tables, and shiki code highlighting. */}
          <MessageResponse>{message.content}</MessageResponse>
          {message.isStreaming && (
            <span
              className="ml-0.5 inline-block h-4 w-[3px] animate-pulse rounded-full bg-primary align-text-bottom"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Footer: time + copy, revealed on hover */}
        {!message.isStreaming && (
          <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-[10px] text-muted-foreground/70">
              {formatMessageTime(message.timestamp)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              aria-label="Copy message"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
