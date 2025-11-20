"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  BarChart3,
  Users,
  BookOpen,
  Plus,
  GraduationCap,
  Target,
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
              onSelect={() => runCommand(() => router.push("/dashboard/products"))}
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Product Library</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/training"))}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Training Programs</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/learning"))}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>Learning Hub</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/products/create"))}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Product</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/training"))}
            >
              <Target className="mr-2 h-4 w-4" />
              <span>Take a Quiz</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/learning"))}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>Check Learning Progress</span>
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
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
