'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { QuestionDTO } from '@/lib/types/learning'

interface QuestionDisplayProps {
  question: QuestionDTO
  questionNumber: number
  selectedAnswer: number | null
  onAnswerSelect: (optionIndex: number) => void
  disabled?: boolean
  showCorrectAnswer?: boolean
}

export function QuestionDisplay({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
  showCorrectAnswer = false,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="space-y-2">
        <Badge variant="outline" className="font-mono">
          Question {questionNumber}
        </Badge>
        <h3 className="text-xl font-semibold leading-relaxed">{question.text}</h3>
      </div>

      {/* Answer Options */}
      <RadioGroup
        key={question.id} // Force re-render when question changes
        value={selectedAnswer?.toString() ?? undefined}
        onValueChange={(value) => onAnswerSelect(parseInt(value))}
        disabled={disabled}
        className="space-y-3"
      >
        {question.options.map((option) => (
          <div
            key={option.index}
            onClick={() => !disabled && onAnswerSelect(option.index)}
            className={cn(
              'flex items-start space-x-3 rounded-lg border p-4 transition-colors',
              selectedAnswer === option.index && 'bg-muted border-primary',
              showCorrectAnswer &&
                option.index === question.correct_answer &&
                'border-green-500 bg-green-50 dark:bg-green-950',
              showCorrectAnswer &&
                selectedAnswer === option.index &&
                option.index !== question.correct_answer &&
                'border-red-500 bg-red-50 dark:bg-red-950',
              !disabled && 'hover:bg-muted/50 cursor-pointer',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <RadioGroupItem value={option.index.toString()} id={`option-${option.index}`} />
            <Label
              htmlFor={`option-${option.index}`}
              className={cn(
                'flex-1 cursor-pointer leading-relaxed',
                disabled && 'cursor-not-allowed'
              )}
            >
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
