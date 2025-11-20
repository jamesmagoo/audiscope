'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  Clock,
  Award,
  TrendingUp,
  PlayCircle,
  CheckCircle2
} from 'lucide-react'

export interface Quiz {
  id: string
  productId: string
  productName: string
  manufacturer: string
  title: string
  description: string
  questionCount: number
  estimatedTime: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  lastAttemptScore?: number
  lastAttemptDate?: string
  attempts: number
  bestScore?: number
}

interface QuizCardProps {
  quiz: Quiz
  onStart: (quizId: string) => void
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

export function QuizCard({ quiz, onStart }: QuizCardProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[quiz.difficulty]
  const hasAttempted = quiz.attempts > 0

  return (
    <Card className="p-5 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 line-clamp-2">{quiz.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{quiz.productName}</span>
            <span className="text-xs">•</span>
            <span>{quiz.manufacturer}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {quiz.category}
          </Badge>
        </div>

        <Badge variant="secondary" className={difficultyConfig.color}>
          {difficultyConfig.label}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {quiz.description}
      </p>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4" />
          <span>{quiz.questionCount} questions</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{quiz.estimatedTime}</span>
        </div>
        {hasAttempted && (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{quiz.attempts} attempt{quiz.attempts !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      {hasAttempted && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {quiz.lastAttemptScore !== undefined && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Last Score</span>
              </div>
              <p className="text-xl font-bold">{quiz.lastAttemptScore}%</p>
              {quiz.lastAttemptDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {quiz.lastAttemptDate}
                </p>
              )}
            </div>
          )}

          {quiz.bestScore !== undefined && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary font-medium">Best Score</span>
              </div>
              <p className="text-xl font-bold text-primary">{quiz.bestScore}%</p>
              {quiz.bestScore >= 90 && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Mastered!</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <Button
        className="w-full"
        variant={hasAttempted ? 'outline' : 'default'}
        onClick={() => onStart(quiz.id)}
      >
        <PlayCircle className="h-4 w-4 mr-2" />
        {hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
      </Button>
    </Card>
  )
}
