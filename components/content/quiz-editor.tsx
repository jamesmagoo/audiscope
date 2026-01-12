'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Send, Trash2, Plus, GripVertical, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditableText } from '@/components/ui/editable-text'
import {
  useGeneration,
  useUpdateGeneration,
  usePublishGeneration,
} from '@/hooks/use-generated-content'
import { useProduct } from '@/hooks/use-products'
import type { QuizContent, QuizQuestion, QuestionOption } from '@/lib/types/generated-content'

interface QuizEditorProps {
  contentId: string
  onPublished?: () => void
  onBack?: () => void
}

interface EditableQuestion extends QuizQuestion {
  id: string // For drag-and-drop
}

function QuestionCard({
  question,
  questionNumber,
  onUpdate,
  onDelete,
  disabled,
}: {
  question: EditableQuestion
  questionNumber: number
  onUpdate: (updated: EditableQuestion) => void
  onDelete: () => void
  disabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleQuestionTextChange = (text: string) => {
    onUpdate({ ...question, text })
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...question.options]
    newOptions[index] = { ...newOptions[index], text }
    onUpdate({ ...question, options: newOptions })
  }

  const handleCorrectAnswerChange = (index: number) => {
    onUpdate({ ...question, correct_answer: index })
  }

  const handleExplanationChange = (text: string) => {
    onUpdate({ ...question, explanation: text })
  }

  return (
    <>
      <Card ref={setNodeRef} style={style} className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {questionNumber}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={disabled}
                  className="h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <EditableText
                value={question.text}
                onChange={handleQuestionTextChange}
                placeholder="Enter question text..."
                multiline
                variant="default"
                disabled={disabled}
              />

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Answer Options
                </div>
                {question.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => handleCorrectAnswerChange(idx)}
                      disabled={disabled}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        question.correct_answer === idx
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-muted-foreground/30 hover:border-green-500'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title="Mark as correct answer"
                    >
                      {question.correct_answer === idx && <Check className="h-4 w-4" />}
                    </button>
                    <div className="flex-1">
                      <EditableText
                        value={option.text}
                        onChange={(text) => handleOptionChange(idx, text)}
                        placeholder={`Option ${idx + 1}...`}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Explanation
                </div>
                <EditableText
                  value={question.explanation}
                  onChange={handleExplanationChange}
                  placeholder="Explain why this is the correct answer..."
                  multiline
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove Question {questionNumber} from the quiz.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function QuizEditor({ contentId, onPublished, onBack }: QuizEditorProps) {
  const { data: generation, isLoading } = useGeneration(contentId)
  const { data: product } = useProduct(generation?.product_id || null)
  const updateMutation = useUpdateGeneration(contentId)
  const publishMutation = usePublishGeneration(contentId)

  const [editedContent, setEditedContent] = useState<QuizContent | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize edited content when generation loads
  useEffect(() => {
    if (generation && !editedContent) {
      // Add unique IDs for drag-and-drop
      const questionsWithIds: EditableQuestion[] = generation.content.questions.map((q) => ({
        ...q,
        id: `question-${q.position}`,
      }))
      setEditedContent({
        ...generation.content,
        questions: questionsWithIds,
      })
    }
  }, [generation, editedContent])

  const handleTitleChange = (title: string) => {
    if (editedContent) {
      setEditedContent({ ...editedContent, title })
      setHasUnsavedChanges(true)
    }
  }

  const handleDifficultyChange = (difficulty: string) => {
    if (editedContent) {
      setEditedContent({ ...editedContent, difficulty })
      setHasUnsavedChanges(true)
    }
  }

  const handleQuestionUpdate = (index: number, updated: EditableQuestion) => {
    if (editedContent) {
      const newQuestions = [...editedContent.questions]
      newQuestions[index] = updated
      setEditedContent({ ...editedContent, questions: newQuestions })
      setHasUnsavedChanges(true)
    }
  }

  const handleQuestionDelete = (index: number) => {
    if (editedContent) {
      const newQuestions = editedContent.questions.filter((_, idx) => idx !== index)
      // Update positions
      const reindexed = newQuestions.map((q, idx) => ({ ...q, position: idx + 1 }))
      setEditedContent({ ...editedContent, questions: reindexed })
      setHasUnsavedChanges(true)
    }
  }

  const handleAddQuestion = () => {
    if (editedContent) {
      const newPosition = editedContent.questions.length + 1
      const newQuestion: EditableQuestion = {
        id: `question-${Date.now()}`,
        text: '',
        type: 'multiple_choice',
        options: [
          { index: 0, text: '' },
          { index: 1, text: '' },
          { index: 2, text: '' },
          { index: 3, text: '' },
        ],
        correct_answer: 0,
        explanation: '',
        position: newPosition,
      }
      setEditedContent({
        ...editedContent,
        questions: [...editedContent.questions, newQuestion],
      })
      setHasUnsavedChanges(true)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && editedContent) {
      const questions = editedContent.questions as EditableQuestion[]
      const oldIndex = questions.findIndex((q) => q.id === active.id)
      const newIndex = questions.findIndex((q) => q.id === over.id)

      const reordered = arrayMove(questions, oldIndex, newIndex)
      // Update positions
      const reindexed = reordered.map((q, idx) => ({ ...q, position: idx + 1 }))

      setEditedContent({ ...editedContent, questions: reindexed })
      setHasUnsavedChanges(true)
    }
  }

  const handleSave = async () => {
    if (!editedContent) return

    try {
      // Remove the 'id' field before saving (backend doesn't expect it)
      const questions = editedContent.questions as EditableQuestion[]
      const contentToSave: QuizContent = {
        ...editedContent,
        questions: questions.map(({ id, ...rest }) => rest),
      }

      await updateMutation.mutateAsync({
        content: contentToSave,
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handlePublishClick = () => {
    setPublishDialogOpen(true)
  }

  const handlePublishConfirm = async () => {
    try {
      // Save first if there are unsaved changes
      if (hasUnsavedChanges && editedContent) {
        const questions = editedContent.questions as EditableQuestion[]
        const contentToSave: QuizContent = {
          ...editedContent,
          questions: questions.map(({ id, ...rest }) => rest),
        }
        await updateMutation.mutateAsync({
          content: contentToSave,
        })
        setHasUnsavedChanges(false)
      }

      // Then publish
      await publishMutation.mutateAsync()

      setPublishDialogOpen(false)

      if (onPublished) {
        onPublished()
      }
    } catch (error) {
      console.error('Publish failed:', error)
      setPublishDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!generation || !editedContent) {
    return (
      <Alert>
        <AlertDescription>Generation not found</AlertDescription>
      </Alert>
    )
  }

  const getStatusBadge = (workflowState: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      edited: { label: 'Edited', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      published: { label: 'Published', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    }
    const config = variants[workflowState] || variants.draft
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>
  }

  const isPublished = generation.is_published
  const isDisabled = isPublished || updateMutation.isPending || publishMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              ← Back to Content
            </Button>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <EditableText
              value={editedContent.title}
              onChange={handleTitleChange}
              variant="heading"
              placeholder="Quiz Title"
              disabled={isDisabled}
            />
            {getStatusBadge(generation.workflow_state)}
            {hasUnsavedChanges && !isPublished && (
              <Badge variant="outline" className="text-orange-600 whitespace-nowrap">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Product: {product?.name || generation.product_name || 'Loading...'}</span>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>Difficulty:</span>
              <Select
                value={editedContent.difficulty}
                onValueChange={handleDifficultyChange}
                disabled={isDisabled}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span>•</span>
            <span>{editedContent.questions.length} questions</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isDisabled || !hasUnsavedChanges}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Edits
          </Button>
          <Button
            onClick={handlePublishClick}
            disabled={isDisabled || isPublished}
          >
            {publishMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isPublished ? 'Published' : 'Publish'}
          </Button>
        </div>
      </div>

      {isPublished && (
        <Alert>
          <AlertDescription>
            This quiz has been published and is now read-only. Published quizzes cannot be edited.
          </AlertDescription>
        </Alert>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={(editedContent.questions as EditableQuestion[]).map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {(editedContent.questions as EditableQuestion[]).map((question, idx) => (
              <QuestionCard
                key={question.id}
                question={question}
                questionNumber={idx + 1}
                onUpdate={(updated) => handleQuestionUpdate(idx, updated)}
                onDelete={() => handleQuestionDelete(idx)}
                disabled={isDisabled}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!isPublished && (
          <Button
            variant="outline"
            onClick={handleAddQuestion}
            disabled={isDisabled}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        )}
      </div>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish "{editedContent?.title}" to the Learning Hub.
              Once published, this quiz will become read-only and cannot be edited.
              {hasUnsavedChanges && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Your unsaved changes will be saved automatically before publishing.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublishConfirm}
              disabled={publishMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Quiz'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
