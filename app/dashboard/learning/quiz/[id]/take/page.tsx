'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { QuizTaker } from '@/components/learning/quiz-taking/quiz-taker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

interface QuizTakePageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuizTakePage({ params }: QuizTakePageProps) {
  const { id: quizId } = use(params)
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')

  if (!attemptId) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="py-12">
            <Alert variant="destructive">
              <AlertDescription>
                No attempt ID found. Please start the quiz from the quiz details page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuizTaker quizId={quizId} attemptId={attemptId} />
    </div>
  )
}
