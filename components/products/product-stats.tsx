'use client'

import { useProducts } from '@/hooks/use-products'
import { useAuth } from '@/components/providers/auth-provider'
import { Card } from '@/components/ui/card'
import { Sparkles, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ProductStats() {
  const { user, loading: authLoading } = useAuth()

  // CRITICAL: Only enable fetching if auth is NOT loading AND user exists
  // This prevents queries from running during initial session hydration
  const shouldFetch = !authLoading && !!user

  const { data: products, isLoading } = useProducts(undefined, shouldFetch)

  // Wait for auth to complete before showing anything
  if (authLoading || !user) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  const productsArray = Array.isArray(products) ? products : []

  // Calculate statistics
  const totalProducts = productsArray.length

  // Count products with files (ready for AI chat)
  const productsWithFiles = productsArray.filter((p: any) => {
    const totalFiles = p.total_files || p.totalFiles || p.TotalFiles || 0
    return totalFiles > 0
  }).length

  // Find most recent product (simple heuristic - could be enhanced)
  const mostRecentProduct = productsArray.length > 0
    ? productsArray[0]?.name || 'None'
    : 'None'

  if (totalProducts === 0) {
    return null // Don't show stats if no products
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Products ready for AI */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center cursor-help">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Upload product documentation, ask questions, and practice with AI-powered guidance</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold">{productsWithFiles}</p>
              <p className="text-xs text-muted-foreground">Products ready for AI chat</p>
            </div>
          </div>
        </Card>

        {/* Most recent product */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center cursor-help">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Your latest product. Open any product to access practice sessions, quizzes, and learning materials</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{mostRecentProduct}</p>
              <p className="text-xs text-muted-foreground">Most recent product</p>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  )
}
