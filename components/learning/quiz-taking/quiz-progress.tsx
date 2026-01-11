'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface QuizProgressProps {
  current: number
  total: number
  answeredQuestions?: number[] // Positions of answered questions (0-indexed)
  className?: string
}

export function QuizProgress({ current, total, answeredQuestions = [], className }: QuizProgressProps) {
  const answeredCount = answeredQuestions.length
  const percentage = (answeredCount / total) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Question {current} of {total}
        </span>
        <span className="text-muted-foreground">
          {answeredCount} answered • {Math.round(percentage)}% Complete
        </span>
      </div>
      <Progress value={percentage} className="h-2" />

      {/* Mini question indicators */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: total }, (_, i) => {
          const isAnswered = answeredQuestions.includes(i)
          const isCurrent = i === current - 1

          return (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                isAnswered && 'bg-green-500 dark:bg-green-600', // Answered = green
                isCurrent && !isAnswered && 'bg-blue-500 ring-2 ring-blue-500 ring-offset-2', // Current = blue with ring
                !isAnswered && !isCurrent && 'bg-muted' // Unanswered = gray
              )}
              title={
                isAnswered
                  ? `Question ${i + 1}: Answered ✓`
                  : isCurrent
                  ? `Question ${i + 1}: Current`
                  : `Question ${i + 1}: Not answered`
              }
            />
          )
        })}
      </div>
    </div>
  )
}
