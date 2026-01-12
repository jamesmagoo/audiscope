'use client'

import { useRouter } from 'next/navigation'
import { Clock, FileQuestion, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LearningQuiz } from '@/lib/types/learning'

interface QuizCardProps {
  quiz: LearningQuiz
}

export function QuizCard({ quiz }: QuizCardProps) {
  const router = useRouter()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusBadge = () => {
    switch (quiz.completion_status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Completed
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            In Progress
          </Badge>
        )
      case 'not_started':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Not Started
          </Badge>
        )
    }
  }

  const getActionButton = () => {
    switch (quiz.completion_status) {
      case 'completed':
        return (
          <Button
            onClick={() => router.push(`/dashboard/learning/quiz/${quiz.id}`)}
            variant="outline"
            className="w-full"
          >
            Retake Quiz
          </Button>
        )
      case 'in_progress':
        return (
          <Button onClick={() => router.push(`/dashboard/learning/quiz/${quiz.id}`)} className="w-full">
            Continue Quiz
          </Button>
        )
      case 'not_started':
        return (
          <Button onClick={() => router.push(`/dashboard/learning/quiz/${quiz.id}`)} className="w-full">
            Start Quiz
          </Button>
        )
    }
  }

  const getBorderColor = () => {
    switch (quiz.difficulty) {
      case 'beginner':
        return 'border-l-green-500'
      case 'intermediate':
        return 'border-l-yellow-500'
      case 'advanced':
        return 'border-l-red-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <Card
      className={cn(
        'border-l-4 hover:shadow-md transition-shadow cursor-pointer',
        getBorderColor()
      )}
      onClick={() => router.push(`/dashboard/learning/quiz/${quiz.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{quiz.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{quiz.product_name}</p>
          </div>
          <FileQuestion className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={getDifficultyColor(quiz.difficulty)}>
            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
          </Badge>
          {getStatusBadge()}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileQuestion className="h-4 w-4" />
            <span>{quiz.question_count} questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>~{quiz.estimated_time_minutes} min</span>
          </div>
        </div>

        {/* Attempt Info */}
        {quiz.attempt_count > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>{quiz.attempt_count} attempt{quiz.attempt_count !== 1 ? 's' : ''}</span>
            </div>
            {quiz.best_score !== undefined && quiz.best_score !== null && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Best: {quiz.best_score}%</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div onClick={(e) => e.stopPropagation()}>{getActionButton()}</div>
      </CardContent>
    </Card>
  )
}
