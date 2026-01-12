'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { QuizResultsSummary } from '@/components/learning/quiz-taking/quiz-results-summary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

interface QuizResultsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuizResultsPage({ params }: QuizResultsPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')

  if (!attemptId) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertDescription>
                Missing attempt ID. Please complete a quiz to view results.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuizResultsSummary quizId={id} attemptId={attemptId} />
    </div>
  )
}
