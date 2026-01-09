'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuizProgress } from './quiz-progress'
import { QuestionDisplay } from './question-display'
import { AnswerFeedback } from './answer-feedback'
import { useQuizDetail, useStartQuizAttempt, useSubmitAnswer, useCompleteQuizAttempt } from '@/hooks/use-learning'
import type { AnswerFeedback as AnswerFeedbackType } from '@/lib/types/learning'

interface QuizTakerProps {
  quizId: string
}

export function QuizTaker({ quizId }: QuizTakerProps) {
  const router = useRouter()
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuizDetail(quizId)
  const startAttemptMutation = useStartQuizAttempt()
  const submitAnswerMutation = useSubmitAnswer()
  const completeQuizMutation = useCompleteQuizAttempt()

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<AnswerFeedbackType | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})

  // Start quiz attempt when quiz loads
  useEffect(() => {
    if (quiz && !attemptId) {
      startAttemptMutation.mutate(quizId, {
        onSuccess: (attempt) => {
          setAttemptId(attempt.id)
        },
      })
    }
  }, [quiz, quizId, attemptId, startAttemptMutation])

  const currentQuestion = quiz?.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === (quiz?.questions.length || 0) - 1

  const handleAnswerSelect = (optionIndex: number) => {
    if (feedback) return // Already answered
    setSelectedAnswer(optionIndex)
  }

  const handleSubmitAnswer = () => {
    if (!attemptId || selectedAnswer === null || !currentQuestion) return

    submitAnswerMutation.mutate(
      {
        attemptId,
        answer: {
          question_position: currentQuestion.position,
          selected_option_index: selectedAnswer,
        },
      },
      {
        onSuccess: (feedbackData) => {
          setFeedback(feedbackData)
          setUserAnswers((prev) => ({
            ...prev,
            [currentQuestion.position]: selectedAnswer,
          }))
        },
      }
    )
  }

  const handleContinue = () => {
    if (isLastQuestion) {
      // Complete the quiz
      if (!attemptId) return
      completeQuizMutation.mutate(attemptId, {
        onSuccess: (result) => {
          // Navigate to results page
          router.push(`/dashboard/learning/quiz/${quizId}/results?attemptId=${result.id}`)
        },
      })
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setFeedback(null)
    }
  }

  if (quizLoading || startAttemptMutation.isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading quiz...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizError || startAttemptMutation.error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertDescription>
              {(quizError as any)?.message ||
                (startAttemptMutation.error as any)?.message ||
                'Failed to load quiz. Please try again.'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!quiz || !currentQuestion) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">{quiz.product_name}</p>
        </div>
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Quiz
        </Button>
      </div>

      {/* Quiz Card */}
      <Card>
        <CardHeader>
          <QuizProgress current={currentQuestionIndex + 1} total={quiz.questions.length} />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            disabled={!!feedback}
          />

          {/* Submit Button (before feedback) */}
          {!feedback && (
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null || submitAnswerMutation.isPending}
                size="lg"
              >
                {submitAnswerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </Button>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <AnswerFeedback
              isCorrect={feedback.is_correct}
              explanation={feedback.explanation}
              onContinue={handleContinue}
              isLastQuestion={isLastQuestion}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
