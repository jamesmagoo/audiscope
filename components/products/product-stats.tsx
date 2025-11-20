'use client'

import { useProducts } from '@/hooks/use-products'
import { Card } from '@/components/ui/card'
import { Sparkles, FileText, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductStats() {
  const { data: products, isLoading } = useProducts()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
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

  // Calculate total files processed today (we'll count all completed files for now)
  const totalFilesProcessed = productsArray.reduce((sum: number, p: any) => {
    const files = p.files || p.Files || []
    const completedFiles = files.filter((f: any) => {
      const status = f.processing_status || f.processingStatus || f.ProcessingStatus
      return status === 'completed'
    }).length
    return sum + completedFiles
  }, 0)

  // Find most recent product (simple heuristic - could be enhanced)
  const mostRecentProduct = productsArray.length > 0
    ? productsArray[0]?.name || 'None'
    : 'None'

  if (totalProducts === 0) {
    return null // Don't show stats if no products
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Products ready for AI */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold">{productsWithFiles}</p>
            <p className="text-xs text-muted-foreground">Products ready for AI chat</p>
          </div>
        </div>
      </Card>

      {/* Files processed */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold">{totalFilesProcessed}</p>
            <p className="text-xs text-muted-foreground">Files processed</p>
          </div>
        </div>
      </Card>

      {/* Most recent product */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{mostRecentProduct}</p>
            <p className="text-xs text-muted-foreground">Most recent product</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
