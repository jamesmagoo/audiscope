'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuizProgress } from './quiz-progress'
import { QuestionDisplay } from './question-display'
import { AnswerFeedback } from './answer-feedback'
import { useQuizDetail, useSubmitAnswer, useCompleteQuizAttempt, useAttemptResults } from '@/hooks/use-learning'
import type { AnswerFeedback as AnswerFeedbackType } from '@/lib/types/learning'
import { usePostHog } from 'posthog-js/react'
import { QUIZ_EVENTS } from '@/lib/analytics/posthog-events'

interface QuizTakerProps {
  quizId: string
  attemptId: string
}

export function QuizTaker({ quizId, attemptId }: QuizTakerProps) {
  const router = useRouter()
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuizDetail(quizId)
  // Pass quizId to useAttemptResults so it can check the cache before fetching quiz again
  const { data: attemptDetails, isLoading: attemptLoading } = useAttemptResults(attemptId, quizId)
  const submitAnswerMutation = useSubmitAnswer()
  const completeQuizMutation = useCompleteQuizAttempt()
  const posthog = usePostHog()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<AnswerFeedbackType | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const quizStartTracked = useRef(false)
  const questionStartTime = useRef<number>(Date.now())

  // Track quiz started (once when quiz loads)
  useEffect(() => {
    if (quiz && !quizStartTracked.current) {
      posthog?.capture(QUIZ_EVENTS.QUIZ_STARTED, {
        quizId: quiz.id,
        attemptId,
        quizTitle: quiz.title,
        totalQuestions: quiz.questions.length,
        productId: quiz.product_id,
      })
      quizStartTracked.current = true
    }
  }, [quiz, attemptId, posthog])

  // Track question viewed when question changes
  useEffect(() => {
    if (currentQuestion) {
      posthog?.capture(QUIZ_EVENTS.QUIZ_QUESTION_VIEWED, {
        quizId,
        attemptId,
        questionId: currentQuestion.id,
        questionPosition: currentQuestionIndex + 1,
        totalQuestions: quiz?.questions.length || 0,
      })
      // Reset timer for new question
      questionStartTime.current = Date.now()
    }
  }, [currentQuestionIndex, currentQuestion, quizId, attemptId, quiz, posthog])

  // Load existing answers when attempt details are fetched
  useEffect(() => {
    // Wait for both quiz and attempt details to load
    if (!quiz || !attemptDetails || attemptDetails.answers.length === 0) {
      return
    }

    console.log('[Quiz Restoration] Starting restoration')
    console.log('[Quiz Restoration] Attempt details:', attemptDetails)
    console.log('[Quiz Restoration] Quiz questions:', quiz.questions)

    // CRITICAL: answer.question_position is ALREADY the array index (0, 1, 2...)
    // It was transformed by the backend DTO mapping layer
    const answersMap: Record<number, number> = {}
    attemptDetails.answers.forEach((answer) => {
      console.log('[Quiz Restoration] Processing answer:', answer)
      const arrayIndex = answer.question_position

      // Safeguard: Ensure position is within bounds
      if (arrayIndex >= 0 && arrayIndex < quiz.questions.length) {
        answersMap[arrayIndex] = answer.selected_option_index
        console.log(`[Quiz Restoration] Stored answer at array index ${arrayIndex} (option ${answer.selected_option_index})`)
      } else {
        console.error(`[Quiz Restoration] ERROR: answer.question_position ${arrayIndex} is out of bounds (quiz has ${quiz.questions.length} questions)`)
      }
    })
    console.log('[Quiz Restoration] Answers map (by array index):', answersMap)
    setUserAnswers(answersMap)

    // Find the first unanswered question (returns array index)
    const firstUnanswered = quiz.questions.findIndex((q, arrayIndex) => {
      const isAnswered = answersMap[arrayIndex] !== undefined
      console.log(`[Quiz Restoration] Question at array index ${arrayIndex} (position ${q.position}): isAnswered=${isAnswered}`)
      return !isAnswered
    })
    console.log('[Quiz Restoration] First unanswered array index:', firstUnanswered)

    if (firstUnanswered !== -1) {
      console.log('[Quiz Restoration] Setting current question index to:', firstUnanswered)
      setCurrentQuestionIndex(firstUnanswered)  // ✅ Use array index directly, no +1!
      // Clear any selected answer for the new question
      setSelectedAnswer(null)
      setFeedback(null)
    } else {
      console.log('[Quiz Restoration] All questions answered!')
    }
  }, [attemptDetails, quiz])

  const currentQuestion = quiz?.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === (quiz?.questions.length || 0) - 1

  const handleAnswerSelect = (optionIndex: number) => {
    if (feedback) return // Already answered
    setSelectedAnswer(optionIndex)
  }

  const handleSubmitAnswer = () => {
    if (!attemptId || selectedAnswer === null || !currentQuestion) return

    console.log('[Submit Answer] Submitting answer for question index:', currentQuestionIndex, 'position:', currentQuestion.position)

    submitAnswerMutation.mutate(
      {
        attemptId,
        answer: {
          question_position: currentQuestion.position,
          selected_option_index: selectedAnswer,
        },
        questionId: currentQuestion.id,
      },
      {
        onSuccess: (feedbackData) => {
          console.log('[Submit Answer] Success! Feedback:', feedbackData)
          setFeedback(feedbackData)

          // Track quiz answer submission
          const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000)
          posthog?.capture(QUIZ_EVENTS.QUIZ_QUESTION_ANSWERED, {
            quizId,
            attemptId,
            questionId: currentQuestion.id,
            questionPosition: currentQuestionIndex + 1,
            selectedOption: selectedAnswer,
            isCorrect: feedbackData.is_correct,
            timeTaken,
          })

          // ✅ Store answer by ARRAY INDEX (not position) for consistency with progress dots
          setUserAnswers((prev) => {
            const updated = {
              ...prev,
              [currentQuestionIndex]: selectedAnswer,  // Use array index!
            }
            console.log('[Submit Answer] Updated userAnswers:', updated)
            return updated
          })
        },
        onError: (error) => {
          console.error('[Submit Answer] Error:', error)
        }
      }
    )
  }

  const handleContinue = () => {
    if (isLastQuestion) {
      if (!attemptId) return
      completeQuizMutation.mutate(attemptId, {
        onSuccess: (result) => {
          // Track quiz completion
          posthog?.capture(QUIZ_EVENTS.QUIZ_COMPLETED, {
            quizId,
            attemptId: result.id,
            quizTitle: quiz?.title,
            score: result.score,
            correctAnswers: result.correct_answers,
            totalQuestions: quiz?.questions.length || 0,
          })

          router.push(`/dashboard/learning/quiz/${quizId}/results?attemptId=${result.id}`)
        },
      })
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setFeedback(null)
    }
  }

  if (quizLoading || attemptLoading) {
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

  if (quizError) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertDescription>
              {(quizError as any)?.message || 'Failed to load quiz. Please try again.'}
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
        <Button onClick={() => router.push('/dashboard/learning')} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Quiz
        </Button>
      </div>

      {/* Quiz Card */}
      <Card>
        <CardHeader>
          <QuizProgress
            current={currentQuestionIndex + 1}
            total={quiz.questions.length}
            answeredQuestions={Object.keys(userAnswers).map((k) => parseInt(k))}
          />
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

          {/* Submit Button */}
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
