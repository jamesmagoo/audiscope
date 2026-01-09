'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw, ArrowLeft, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAttemptResults, useQuizDetail, useStartQuizAttempt } from '@/hooks/use-learning'
import type { QuizQuestion } from '@/lib/types/generated-content'

interface QuizResultsSummaryProps {
  quizId: string
  attemptId: string
}

export function QuizResultsSummary({ quizId, attemptId }: QuizResultsSummaryProps) {
  const router = useRouter()
  const { data: attempt, isLoading } = useAttemptResults(attemptId)
  const { data: quiz } = useQuizDetail(quizId)
  const startAttemptMutation = useStartQuizAttempt()
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  const toggleQuestion = (position: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(position)) {
        newSet.delete(position)
      } else {
        newSet.add(position)
      }
      return newSet
    })
  }

  const handleRetake = () => {
    startAttemptMutation.mutate(quizId, {
      onSuccess: (newAttempt) => {
        router.push(`/dashboard/learning/quiz/${quizId}`)
      },
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading results...</p>
        </CardContent>
      </Card>
    )
  }

  if (!attempt || !quiz) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertDescription>Failed to load quiz results.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const score = attempt.score || 0
  const correctAnswers = attempt.correct_answers || 0
  const totalQuestions = attempt.total_questions

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' // Green
    if (score >= 60) return 'secondary' // Yellow
    return 'destructive' // Red
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz Results</h1>
          <p className="text-sm text-muted-foreground">{quiz.title}</p>
        </div>
        <Button onClick={() => router.push('/dashboard/learning')} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Learning Hub
        </Button>
      </div>

      {/* Score Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Your Score
            </CardTitle>
            <Badge
              variant={getScoreBadgeVariant(score)}
              className={cn(
                'text-lg px-4 py-1',
                score >= 80 && 'bg-green-500 hover:bg-green-600',
                score >= 60 && score < 80 && 'bg-yellow-500 hover:bg-yellow-600',
                score < 60 && 'bg-red-500 hover:bg-red-600'
              )}
            >
              {score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">Correct Answers:</span>
              <span className="font-semibold">
                {correctAnswers} / {totalQuestions}
              </span>
            </div>

            {score >= 80 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Excellent work! You've mastered this quiz.
                </AlertDescription>
              </Alert>
            )}

            {score >= 60 && score < 80 && (
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  Good effort! Review the questions below to improve your score.
                </AlertDescription>
              </Alert>
            )}

            {score < 60 && (
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Keep practicing! Review the explanations and try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={handleRetake} className="flex-1" disabled={startAttemptMutation.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button
                onClick={() => router.push('/dashboard/learning')}
                variant="outline"
                className="flex-1"
              >
                Back to Quizzes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((question: QuizQuestion, idx: number) => {
            const userAnswer = attempt.answers.find((a) => a.question_position === question.position)
            const isCorrect = userAnswer?.is_correct || false
            const isExpanded = expandedQuestions.has(question.position)

            return (
              <div key={question.position} className="space-y-2">
                <button
                  onClick={() => toggleQuestion(question.position)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            Question {idx + 1}
                          </Badge>
                          <p className="font-medium">{question.text}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-12 space-y-3 pb-3">
                    {/* Your Answer */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Your Answer:</p>
                      <div
                        className={cn(
                          'p-3 rounded border',
                          isCorrect
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        )}
                      >
                        {question.options[userAnswer?.selected_option_index || 0]?.text}
                      </div>
                    </div>

                    {/* Correct Answer (if wrong) */}
                    {!isCorrect && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Correct Answer:</p>
                        <div className="p-3 rounded border bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                          {question.options[question.correct_answer]?.text}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Explanation:</p>
                      <p className="text-sm leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                )}

                {idx < quiz.questions.length - 1 && <Separator />}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
