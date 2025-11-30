'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle2
} from 'lucide-react'

interface ProductProgress {
  productId: string
  productName: string
  manufacturer: string
  overallProgress: number
  quizzesCompleted: number
  totalQuizzes: number
  averageScore: number
  lastStudied: string
  status: 'mastered' | 'in-progress' | 'not-started'
}

interface ProgressTrackerProps {
  products: ProductProgress[]
}

const STATUS_CONFIG = {
  'mastered': {
    label: 'Mastered',
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  'in-progress': {
    label: 'Learning',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  'not-started': {
    label: 'Not Started',
    icon: Target,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
}

export function ProgressTracker({ products }: ProgressTrackerProps) {
  // Calculate overall stats
  const totalProducts = products.length
  const masteredProducts = products.filter(p => p.status === 'mastered').length
  const inProgressProducts = products.filter(p => p.status === 'in-progress').length
  const overallCompletion = Math.round(
    products.reduce((sum, p) => sum + p.overallProgress, 0) / totalProducts
  )

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Your Learning Progress</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-2xl font-bold">{overallCompletion}%</p>
            <p className="text-sm text-muted-foreground">Overall</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{masteredProducts}</p>
            <p className="text-sm text-muted-foreground">Mastered</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{inProgressProducts}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </div>
        </div>

        <Progress value={overallCompletion} className="h-3" />
      </Card>

      {/* Product Progress List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Product Progress</h4>
        {products.map((product) => {
          const statusConfig = STATUS_CONFIG[product.status]
          const StatusIcon = statusConfig.icon

          return (
            <Card
              key={product.productId}
              className={`p-4 border-l-4 ${statusConfig.borderColor} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium truncate">{product.productName}</h5>
                    <Badge variant="secondary" className="text-xs">
                      {product.manufacturer}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {product.quizzesCompleted}/{product.totalQuizzes} quizzes
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      <span>{product.averageScore}% avg score</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{product.lastStudied}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{product.overallProgress}%</span>
                    </div>
                    <Progress value={product.overallProgress} className="h-2" />
                  </div>
                </div>

                <div className={`flex flex-col items-center gap-1 ${statusConfig.bgColor} px-3 py-2 rounded-lg flex-shrink-0`}>
                  <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                  <span className={`text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
