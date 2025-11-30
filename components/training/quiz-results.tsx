'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Award
} from 'lucide-react'

export interface QuizResult {
  quizId: string
  quizTitle: string
  productName: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeTaken: string
  passThreshold: number
  questionResults: QuestionResult[]
  knowledgeGaps?: string[]
  recommendations?: string[]
}

export interface QuestionResult {
  questionNumber: number
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  topic: string
}

interface QuizResultsProps {
  result: QuizResult
  onRetake: () => void
  onContinue: () => void
}

export function QuizResults({ result, onRetake, onContinue }: QuizResultsProps) {
  const passed = result.score >= result.passThreshold
  const performance = result.score >= 90 ? 'excellent' : result.score >= 75 ? 'good' : result.score >= result.passThreshold ? 'pass' : 'needs-improvement'

  const PERFORMANCE_CONFIG = {
    excellent: {
      title: 'Outstanding Performance!',
      message: 'You have mastered this material. Keep up the excellent work!',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    good: {
      title: 'Great Job!',
      message: 'You have a solid understanding. Review the missed questions to improve further.',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    pass: {
      title: 'You Passed!',
      message: 'Good effort! Consider reviewing the material to strengthen your knowledge.',
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    'needs-improvement': {
      title: 'Keep Practicing',
      message: 'Review the material and try again. You can do this!',
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  }

  const config = PERFORMANCE_CONFIG[performance]
  const PerformanceIcon = config.icon

  // Group incorrect answers by topic
  const incorrectByTopic = result.questionResults
    .filter(q => !q.isCorrect)
    .reduce((acc, q) => {
      if (!acc[q.topic]) {
        acc[q.topic] = []
      }
      acc[q.topic].push(q)
      return acc
    }, {} as Record<string, QuestionResult[]>)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className={`p-8 border-l-4 ${config.borderColor} ${config.bgColor}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${config.bgColor} ring-4 ring-background`}>
            <PerformanceIcon className={`h-8 w-8 ${config.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{config.title}</h2>
            <p className="text-muted-foreground mb-4">{config.message}</p>

            {/* Score Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-3xl font-bold">{result.score}%</p>
                <p className="text-sm text-muted-foreground">Your Score</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{result.correctAnswers}/{result.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{result.timeTaken}</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{result.passThreshold}%</p>
                <p className="text-sm text-muted-foreground">Pass Mark</p>
              </div>
            </div>

            <Progress value={result.score} className="h-3" />
          </div>
        </div>
      </Card>

      {/* Knowledge Gaps */}
      {Object.keys(incorrectByTopic).length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Areas for Improvement</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(incorrectByTopic).map(([topic, questions]) => (
              <div key={topic} className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium">{topic}</h4>
                  <Badge variant="secondary">
                    {questions.length} missed
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review questions {questions.map(q => q.questionNumber).join(', ')} to strengthen your knowledge in this area.
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recommended Next Steps</h3>
          </div>

          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Question Review */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Question Review</h3>

        <div className="space-y-4">
          {result.questionResults.map((question) => (
            <div
              key={question.questionNumber}
              className={`p-4 rounded-lg border-l-4 ${
                question.isCorrect
                  ? 'border-green-500 bg-green-50/50'
                  : 'border-red-500 bg-red-50/50'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {question.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium">
                      Question {question.questionNumber}: {question.question}
                    </h4>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {question.topic}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className={question.isCorrect ? 'text-green-600 font-medium' : 'text-red-600'}>
                        {question.userAnswer}
                      </span>
                    </div>

                    {!question.isCorrect && (
                      <div>
                        <span className="text-muted-foreground">Correct answer: </span>
                        <span className="text-green-600 font-medium">
                          {question.correctAnswer}
                        </span>
                      </div>
                    )}

                    <div className="p-3 bg-background rounded border">
                      <p className="text-muted-foreground text-xs mb-1">Explanation:</p>
                      <p>{question.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onRetake} className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Quiz
        </Button>
        <Button onClick={onContinue} className="flex-1">
          Continue Learning
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
