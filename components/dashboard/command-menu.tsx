"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Home,
  Upload,
  Package,
  MessageSquareText,
  BarChart3,
  Users,
  BookOpen,
  Settings,
  Search,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/cases"))}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Cases</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/upload"))}
            >
              <Upload className="mr-2 h-4 w-4" />
              <span>Upload Assessment</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/assistant"))}
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              <span>Assistant</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/products"))}
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Product Library</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/upload"))}
            >
              <Upload className="mr-2 h-4 w-4" />
              <span>New Assessment</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/cases"))}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search Cases</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Future Features">
            <CommandItem disabled>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem disabled>
              <Users className="mr-2 h-4 w-4" />
              <span>Team Management</span>
            </CommandItem>
            <CommandItem disabled>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Training Programs</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
