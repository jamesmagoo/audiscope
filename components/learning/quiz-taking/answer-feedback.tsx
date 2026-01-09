'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AnswerFeedbackProps {
  isCorrect: boolean
  explanation: string
  onContinue: () => void
  isLastQuestion?: boolean
}

export function AnswerFeedback({
  isCorrect,
  explanation,
  onContinue,
  isLastQuestion = false,
}: AnswerFeedbackProps) {
  return (
    <div className="space-y-4">
      <Alert
        className={cn(
          'border-2',
          isCorrect
            ? 'border-green-500 bg-green-50 dark:bg-green-950'
            : 'border-red-500 bg-red-50 dark:bg-red-950'
        )}
      >
        <div className="flex items-start gap-3">
          {isCorrect ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-2">
            <div
              className={cn(
                'font-semibold',
                isCorrect ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              )}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            <AlertDescription
              className={cn(
                isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              )}
            >
              {explanation}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={onContinue} size="lg">
          {isLastQuestion ? 'Finish Quiz' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
