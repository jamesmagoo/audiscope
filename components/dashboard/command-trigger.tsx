"use client"

import { Command } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CommandTrigger() {
  const handleClick = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 hidden sm:flex"
      onClick={handleClick}
    >
      <Command className="h-4 w-4" />
      <span className="sr-only">Open command menu</span>
    </Button>
  )
}
