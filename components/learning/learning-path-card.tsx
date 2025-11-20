'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  Circle
} from 'lucide-react'
import Link from 'next/link'

interface LearningStep {
  id: string
  title: string
  description: string
  duration: string
  completed: boolean
}

interface LearningPath {
  id: string
  title: string
  description: string
  productId?: string
  productName?: string
  totalSteps: number
  completedSteps: number
  estimatedTime: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  steps: LearningStep[]
  recommended: boolean
}

interface LearningPathCardProps {
  path: LearningPath
}

const DIFFICULTY_CONFIG = {
  beginner: {
    label: 'Beginner',
    color: 'bg-green-100 text-green-700'
  },
  intermediate: {
    label: 'Intermediate',
    color: 'bg-yellow-100 text-yellow-700'
  },
  advanced: {
    label: 'Advanced',
    color: 'bg-red-100 text-red-700'
  }
}

export function LearningPathCard({ path }: LearningPathCardProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[path.difficulty]
  const progress = Math.round((path.completedSteps / path.totalSteps) * 100)

  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{path.title}</h3>
            {path.recommended && (
              <Badge variant="default" className="text-xs">
                Recommended
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{path.description}</p>

          {path.productName && (
            <Badge variant="secondary" className="text-xs">
              {path.productName}
            </Badge>
          )}
        </div>

        <Badge variant="secondary" className={difficultyConfig.color}>
          {difficultyConfig.label}
        </Badge>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4" />
          <span>
            {path.completedSteps}/{path.totalSteps} steps
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{path.estimatedTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{progress}% complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps Preview */}
      <div className="space-y-2 mb-4">
        {path.steps.slice(0, 3).map((step, index) => (
          <div key={step.id} className="flex items-start gap-3 text-sm">
            {step.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${step.completed ? 'text-muted-foreground line-through' : ''}`}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.duration}</p>
            </div>
          </div>
        ))}
        {path.steps.length > 3 && (
          <p className="text-xs text-muted-foreground pl-7">
            +{path.steps.length - 3} more steps
          </p>
        )}
      </div>

      {/* Action Button */}
      <Button
        className="w-full"
        variant={path.completedSteps > 0 ? 'default' : 'outline'}
        asChild
      >
        <Link href={path.productId ? `/dashboard/learning?product=${path.productId}` : '/dashboard/learning'}>
          {path.completedSteps === 0 ? 'Start Learning' : 'Continue Learning'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </Card>
  )
}
