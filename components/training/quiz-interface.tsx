'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Flag
} from 'lucide-react'
import { QuizResults, type QuizResult, type QuestionResult } from './quiz-results'

export interface QuizQuestion {
  id: string
  questionNumber: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  topic: string
}

export interface QuizData {
  id: string
  title: string
  productName: string
  description: string
  questions: QuizQuestion[]
  passThreshold: number
  timeLimit?: number // in minutes
}

interface QuizInterfaceProps {
  quiz: QuizData
  onComplete: (result: QuizResult) => void
  onExit: () => void
}

export function QuizInterface({ quiz, onComplete, onExit }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [timeElapsed, setTimeElapsed] = useState(0) // in seconds
  const [showResults, setShowResults] = useState(false)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const totalQuestions = quiz.questions.length
  const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
  const answeredCount = Object.keys(selectedAnswers).length

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }))
  }

  // Navigate questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index)
    }
  }

  const goToPrevious = () => goToQuestion(currentQuestionIndex - 1)
  const goToNext = () => goToQuestion(currentQuestionIndex + 1)

  // Toggle flag
  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(currentQuestionIndex)) {
        next.delete(currentQuestionIndex)
      } else {
        next.add(currentQuestionIndex)
      }
      return next
    })
  }

  // Submit quiz
  const handleSubmit = () => {
    // Calculate results
    const questionResults: QuestionResult[] = quiz.questions.map((q, index) => {
      const userAnswer = selectedAnswers[index] || 'No answer'
      const isCorrect = userAnswer === q.correctAnswer

      return {
        questionNumber: q.questionNumber,
        question: q.question,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic
      }
    })

    const correctAnswers = questionResults.filter(q => q.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Identify knowledge gaps
    const incorrectTopics = questionResults
      .filter(q => !q.isCorrect)
      .map(q => q.topic)
    const knowledgeGaps = [...new Set(incorrectTopics)]

    // Generate recommendations
    const recommendations: string[] = []
    if (score < 70) {
      recommendations.push('Review all product documentation thoroughly before retaking')
      recommendations.push('Take notes on key features and specifications')
      recommendations.push('Practice with scenario-based questions in the Assistant')
    } else if (score < 85) {
      recommendations.push(`Focus on improving your understanding of: ${knowledgeGaps.join(', ')}`)
      recommendations.push('Review the explanations for questions you missed')
    } else if (score < 100) {
      recommendations.push('Great work! Review the missed questions to achieve mastery')
      recommendations.push('Try more advanced quizzes to continue learning')
    } else {
      recommendations.push('Perfect score! You have mastered this material')
      recommendations.push('Share your knowledge by training team members')
      recommendations.push('Try an advanced quiz to continue challenging yourself')
    }

    const result: QuizResult = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      productName: quiz.productName,
      score,
      correctAnswers,
      totalQuestions,
      timeTaken: formatTime(timeElapsed),
      passThreshold: quiz.passThreshold,
      questionResults,
      knowledgeGaps: knowledgeGaps.length > 0 ? knowledgeGaps : undefined,
      recommendations
    }

    setQuizResult(result)
    setShowResults(true)
    onComplete(result)
  }

  // Show results view
  if (showResults && quizResult) {
    return (
      <QuizResults
        result={quizResult}
        onRetake={() => {
          setCurrentQuestionIndex(0)
          setSelectedAnswers({})
          setFlaggedQuestions(new Set())
          setTimeElapsed(0)
          setShowResults(false)
          setQuizResult(null)
        }}
        onContinue={onExit}
      />
    )
  }

  // Quiz-taking view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{quiz.title}</h2>
            <p className="text-muted-foreground">{quiz.productName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-muted-foreground">
              {answeredCount} answered • {flaggedQuestions.size} flagged
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Question Card */}
      <Card className="p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <Badge variant="secondary" className="mb-3">{currentQuestion.topic}</Badge>
            <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFlag}
            className={flaggedQuestions.has(currentQuestionIndex) ? 'text-yellow-600' : ''}
          >
            <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestionIndex) ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === option
            const optionLabel = String.fromCharCode(65 + index) // A, B, C, D

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-accent ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  }`}>
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{optionLabel}</span>
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Question Navigator */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Question Navigator</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>Answered</span>
            <Flag className="h-3 w-3 ml-2 fill-current text-yellow-600" />
            <span>Flagged</span>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-2">
          {quiz.questions.map((_, index) => {
            const isAnswered = selectedAnswers[index] !== undefined
            const isFlagged = flaggedQuestions.has(index)
            const isCurrent = index === currentQuestionIndex

            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {isFlagged && (
                  <Flag className="absolute h-2.5 w-2.5 -top-1 -right-1 fill-current text-yellow-600" />
                )}
                {index + 1}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onExit}>
            Exit Quiz
          </Button>

          {answeredCount === totalQuestions && (
            <Button onClick={handleSubmit}>
              Submit Quiz
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentQuestionIndex === totalQuestions - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Warning if not all answered */}
      {answeredCount < totalQuestions && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3 text-sm">
            <Flag className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">
                {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's' : ''} unanswered
              </p>
              <p className="text-yellow-700">
                Answer all questions to submit the quiz
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
