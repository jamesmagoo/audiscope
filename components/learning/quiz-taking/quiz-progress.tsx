'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface QuizProgressProps {
  current: number
  total: number
  className?: string
}

export function QuizProgress({ current, total, className }: QuizProgressProps) {
  const percentage = (current / total) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Question {current} of {total}
        </span>
        <span className="text-muted-foreground">{Math.round(percentage)}% Complete</span>
      </div>
      <Progress value={percentage} className="h-2" />

      {/* Mini question dots */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i < current
                ? 'bg-primary'
                : i === current - 1
                ? 'bg-primary ring-2 ring-primary ring-offset-2'
                : 'bg-muted'
            )}
            title={`Question ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
