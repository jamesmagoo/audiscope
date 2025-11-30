'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Package, Sparkles, MoreVertical, GraduationCap, BookOpen, MessageSquare, Target, TrendingUp } from 'lucide-react'
import { useStartSession } from '@/hooks/use-product-chat'

interface ProductCardProps {
  productId: string
  name: string
  manufacturer: string
  modelNumber: string
  category: string
  description?: string
  imageUrl: string | null
  totalFiles: number
}

export function ProductCard({
  productId,
  name,
  manufacturer,
  modelNumber,
  category,
  description,
  imageUrl,
  totalFiles
}: ProductCardProps) {
  const router = useRouter()
  const startSession = useStartSession()
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const handleQuickAction = async (sessionType: 'qa' | 'practice' | 'concept') => {
    if (isCreatingSession) return

    setIsCreatingSession(true)
    try {
      const result = await startSession.mutateAsync({
        productId,
        sessionType,
      })

      // Navigate to product page with session selected
      router.push(`/dashboard/products/${productId}?sessionId=${result.session_id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
      setIsCreatingSession(false)
    }
  }

  const handleAskAI = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleQuickAction('qa')
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer mb-2 relative group">
      <Link href={`/dashboard/products/${productId}`}>
        <div className="flex items-start p-6 gap-4">
          {/* Product Image Thumbnail */}
          <div className="flex-shrink-0 w-20 h-20 rounded-lg border overflow-hidden bg-muted/20 flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <Package className="h-10 w-10 text-muted-foreground/40" />
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="space-y-1 min-w-0 flex-1">
                <CardTitle className="text-lg">{name}</CardTitle>
                <CardDescription>
                  {manufacturer} • Model: {modelNumber}
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex-shrink-0">{category}</Badge>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {description}
              </p>
            )}

            {totalFiles > 0 && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {totalFiles} file{totalFiles !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* AI Actions - Only show if product has files */}
          {totalFiles > 0 && (
            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="default"
                onClick={handleAskAI}
                disabled={isCreatingSession}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Ask AI
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleQuickAction('practice')
                    }}
                    disabled={isCreatingSession}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Practice Demo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleQuickAction('concept')
                    }}
                    disabled={isCreatingSession}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Learn Concepts
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/training?product=${productId}`}>
                      <Target className="h-4 w-4 mr-2" />
                      Take Quiz
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/learning?product=${productId}`}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Progress
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/products/${productId}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}
