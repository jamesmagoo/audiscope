'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStartQuizAttempt, useUserAttempts } from '@/hooks/use-learning'

interface QuizPageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuizPage({ params }: QuizPageProps) {
  const { id: quizId } = use(params)
  const router = useRouter()
  const { data: userAttempts, isLoading: attemptsLoading } = useUserAttempts()
  const startAttemptMutation = useStartQuizAttempt()

  // Check for existing active attempt
  const activeAttempt = userAttempts?.find(
    (attempt) => attempt.quiz_id === quizId && attempt.status === 'in_progress'
  )

  useEffect(() => {
    if (attemptsLoading) return

    if (activeAttempt) {
      // Resume existing attempt
      router.push(`/dashboard/learning/quiz/${quizId}/take?attemptId=${activeAttempt.id}`)
    } else if (!startAttemptMutation.isPending && !startAttemptMutation.data) {
      // Start new attempt
      startAttemptMutation.mutate(quizId, {
        onSuccess: (attempt) => {
          router.push(`/dashboard/learning/quiz/${quizId}/take?attemptId=${attempt.id}`)
        },
      })
    }
  }, [attemptsLoading, activeAttempt, quizId, router, startAttemptMutation])

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Starting quiz...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
