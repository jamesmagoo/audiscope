"use client"

import { motion, useReducedMotion } from "motion/react"

// Adapted from Aceternity UI's LoaderFive (per-character shimmer wave),
// re-themed to design tokens and with a reduced-motion fallback.
export function ThinkingShimmer({ text = "Thinking..." }: { text?: string }) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <span className="text-sm text-muted-foreground">{text}</span>
  }

  return (
    <span className="text-sm font-medium text-muted-foreground" aria-label={text} role="status">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0.35 }}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -1, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.045,
            ease: "easeInOut",
            repeatDelay: 1.2,
          }}
          aria-hidden="true"
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  )
}
