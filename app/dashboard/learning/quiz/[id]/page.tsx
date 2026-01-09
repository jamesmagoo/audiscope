'use client'

import { QuizTaker } from '@/components/learning/quiz-taking/quiz-taker'

interface QuizPageProps {
  params: {
    id: string
  }
}

export default function QuizPage({ params }: QuizPageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <QuizTaker quizId={params.id} />
    </div>
  )
}
