'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FileQuestion, ArrowLeft, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQuizDetail, useStartQuizAttempt, useUserAttempts } from '@/hooks/use-learning'
import { PreviousAttemptsTable } from '@/components/learning/previous-attempts-table'
import Link from 'next/link'

interface QuizPageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuizPage({ params }: QuizPageProps) {
  const { id: quizId } = use(params)
  const router = useRouter()
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuizDetail(quizId)
  const { data: userAttempts, isLoading: attemptsLoading } = useUserAttempts()
  const startAttemptMutation = useStartQuizAttempt()

  // Check for existing active attempt
  const activeAttempt = userAttempts?.find(
    (attempt) => attempt.quiz_id === quizId && attempt.status === 'in_progress'
  )

  const handleStartOrResume = () => {
    if (activeAttempt) {
      // Resume existing attempt
      router.push(`/dashboard/learning/quiz/${quizId}/take?attemptId=${activeAttempt.id}`)
    } else {
      // Start new attempt
      startAttemptMutation.mutate(quizId, {
        onSuccess: (attempt) => {
          router.push(`/dashboard/learning/quiz/${quizId}/take?attemptId=${attempt.id}`)
        },
      })
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return (
      <Badge variant="secondary" className={variants[difficulty] || variants.beginner}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    )
  }

  if (quizLoading || attemptsLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading quiz details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizError || !quiz) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertDescription>
                {(quizError as any)?.message || 'Failed to load quiz. Please try again.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (startAttemptMutation.error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertDescription>
                {(startAttemptMutation.error as any)?.message || 'Failed to start quiz. Please try again.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/learning">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Learning Hub
        </Link>
      </Button>

      {/* Quiz Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileQuestion className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{quiz.title}</CardTitle>
                <CardDescription className="text-base">
                  {quiz.product_name || 'Product Quiz'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Metadata */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Difficulty:</span>
              {getDifficultyBadge(quiz.difficulty)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Questions:</span>
              <Badge variant="outline">{quiz.questions.length}</Badge>
            </div>
          </div>

          {/* Start/Resume Button */}
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleStartOrResume}
              disabled={startAttemptMutation.isPending}
            >
              {startAttemptMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : activeAttempt ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Quiz
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Quiz
                </>
              )}
            </Button>
            {activeAttempt && (
              <Alert className="flex-1">
                <AlertDescription>
                  You have an in-progress attempt. Click "Resume Quiz" to continue where you left off.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous Attempts Table */}
      <PreviousAttemptsTable quizId={quizId} />
    </div>
  )
}
