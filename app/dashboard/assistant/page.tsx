"use client"

import { useState, useEffect } from "react"
import { ChatsPanel } from "@/components/assistant/chats-panel"
import { ChatInterface } from "@/components/assistant/chat-interface"
import { KnowledgeBasePanel } from "@/components/assistant/knowledge-base-panel"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  // Responsive behavior: close panels on mobile by default
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setLeftPanelOpen(false)
        setRightPanelOpen(false)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex h-full w-full bg-background relative">
      {/* Left Panel - Conversations */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out border-r border-border",
        "md:relative absolute top-0 left-0 z-20 h-full bg-background",
        leftPanelOpen ? "w-80 md:w-80" : "w-0 md:w-0"
      )}>
        <div className="h-full overflow-hidden">
          <ChatsPanel 
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id)
              // Auto-close on mobile when conversation is selected
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setLeftPanelOpen(false)
              }
            }}
            onConversationCreated={(chat) => {
              setActiveConversationId(chat.id)
            }}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {leftPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          style={{ top: '4rem' }}
          onClick={() => setLeftPanelOpen(false)}
        />
      )}

      {/* Main Sidebar Trigger (Mobile) */}
      <div className="absolute top-4 left-2 z-40 md:hidden">
        <SidebarTrigger />
      </div>

      {/* Left Panel Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        className={cn(
          "absolute top-4 z-30 h-8 w-8 p-0 hover:bg-muted transition-all",
          leftPanelOpen ? "left-[316px] md:left-[316px]" : "left-12 md:left-2"
        )}
      >
        {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>

      {/* Main Chat Interface */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        leftPanelOpen && "md:ml-0 ml-0"
      )}>
        <ChatInterface 
          conversationId={activeConversationId} 
          onConversationUpdate={(chat) => {
            // Update the conversation ID if it was just created
            if (!activeConversationId && chat.id) {
              setActiveConversationId(chat.id)
            }
          }}
          onNewConversation={() => {
            // Reset to new conversation state
            setActiveConversationId(null)
          }}
        />
      </div>

      {/* Right Panel Toggle Button */}
      {/* <Button
        variant="ghost"
        size="sm"
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className={cn(
          "absolute top-4 z-30 h-8 w-8 p-0 hover:bg-muted transition-all",
          rightPanelOpen ? "right-[316px] md:right-[316px]" : "right-2"
        )}
      >
        {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </Button> */}

      {/* Right Panel - Knowledge Base */}
      {/* <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out border-l border-border",
        "md:relative absolute top-0 right-0 z-20 h-full bg-background",
        rightPanelOpen ? "w-80 md:w-80" : "w-0 md:w-0"
      )}>
        <div className="h-full overflow-hidden">
          <KnowledgeBasePanel />
        </div>
      </div> */}

      {/* Overlay for mobile right panel */}
      {/* {rightPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setRightPanelOpen(false)}
        />
      )} */}
    </div>
  )
}
