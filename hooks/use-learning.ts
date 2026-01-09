/**
 * Learning API React Query Hooks
 *
 * Custom hooks for the Learning API module using TanStack React Query.
 * Handles quiz taking, answer submission, and progress tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  listProductQuizzes,
  listAllQuizzes,
  getQuizDetail,
  startQuizAttempt,
  submitAnswer,
  completeQuizAttempt,
  getAttemptResults,
  getQuizAttempts,
  getProductQuizStats,
  getUserQuizStats,
} from '@/lib/learning.service'
import type {
  LearningQuiz,
  QuizDetail,
  QuizAttempt,
  QuizAttemptWithAnswers,
  AnswerSubmission,
  AnswerFeedback,
  ProductQuizStats,
  UserQuizStats,
} from '@/lib/types/learning'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List quizzes for a specific product
 * Query key: ['learning', 'product-quizzes', productId]
 */
export function useProductQuizzes(productId: string | null) {
  return useQuery<LearningQuiz[]>({
    queryKey: ['learning', 'product-quizzes', productId],
    queryFn: () => {
      if (!productId) throw new Error('Product ID is required')
      return listProductQuizzes(productId)
    },
    enabled: !!productId,
  })
}

/**
 * List all quizzes with optional status filter
 * Query key: ['learning', 'quizzes', status]
 */
export function useAllQuizzes(status?: 'not_started' | 'in_progress' | 'completed') {
  return useQuery<LearningQuiz[]>({
    queryKey: ['learning', 'quizzes', status],
    queryFn: () => listAllQuizzes(status),
  })
}

/**
 * Get full quiz details including questions
 * Query key: ['learning', 'quiz', quizId]
 */
export function useQuizDetail(quizId: string | null) {
  return useQuery<QuizDetail>({
    queryKey: ['learning', 'quiz', quizId],
    queryFn: () => {
      if (!quizId) throw new Error('Quiz ID is required')
      return getQuizDetail(quizId)
    },
    enabled: !!quizId,
  })
}

/**
 * Get quiz attempt results
 * Query key: ['learning', 'attempt', attemptId]
 */
export function useAttemptResults(attemptId: string | null) {
  return useQuery<QuizAttemptWithAnswers>({
    queryKey: ['learning', 'attempt', attemptId],
    queryFn: () => {
      if (!attemptId) throw new Error('Attempt ID is required')
      return getAttemptResults(attemptId)
    },
    enabled: !!attemptId,
  })
}

/**
 * Get all attempts for a specific quiz
 * Query key: ['learning', 'quiz-attempts', quizId]
 */
export function useQuizAttempts(quizId: string | null) {
  return useQuery<QuizAttempt[]>({
    queryKey: ['learning', 'quiz-attempts', quizId],
    queryFn: () => {
      if (!quizId) throw new Error('Quiz ID is required')
      return getQuizAttempts(quizId)
    },
    enabled: !!quizId,
  })
}

/**
 * Get quiz statistics for a product
 * Query key: ['learning', 'product-stats', productId]
 */
export function useProductQuizStats(productId: string | null) {
  return useQuery<ProductQuizStats>({
    queryKey: ['learning', 'product-stats', productId],
    queryFn: () => {
      if (!productId) throw new Error('Product ID is required')
      return getProductQuizStats(productId)
    },
    enabled: !!productId,
  })
}

/**
 * Get overall user quiz statistics
 * Query key: ['learning', 'user-stats']
 */
export function useUserQuizStats() {
  return useQuery<UserQuizStats>({
    queryKey: ['learning', 'user-stats'],
    queryFn: getUserQuizStats,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Start a new quiz attempt
 * Invalidates: product-quizzes, quizzes, quiz-attempts
 */
export function useStartQuizAttempt() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<QuizAttempt, Error, string>({
    mutationFn: startQuizAttempt,
    onSuccess: (data, quizId) => {
      // Invalidate quiz lists to update completion status
      queryClient.invalidateQueries({ queryKey: ['learning', 'product-quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'quiz-attempts', quizId] })
    },
    onError: (error) => {
      toast({
        title: 'Failed to start quiz',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Submit an answer for a question
 * Returns immediate feedback (correct/incorrect + explanation)
 */
export function useSubmitAnswer() {
  const { toast } = useToast()

  return useMutation<
    AnswerFeedback,
    Error,
    { attemptId: string; answer: AnswerSubmission }
  >({
    mutationFn: ({ attemptId, answer }) => submitAnswer(attemptId, answer),
    onError: (error) => {
      toast({
        title: 'Failed to submit answer',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Complete the quiz attempt
 * Invalidates: quiz lists, quiz-attempts, product-stats, user-stats
 */
export function useCompleteQuizAttempt() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<QuizAttemptWithAnswers, Error, string>({
    mutationFn: completeQuizAttempt,
    onSuccess: (data) => {
      // Invalidate all quiz-related queries to refresh completion status
      queryClient.invalidateQueries({ queryKey: ['learning', 'product-quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'quiz-attempts', data.quiz_id] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'product-stats'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'user-stats'] })

      // Cache the completed attempt
      queryClient.setQueryData(['learning', 'attempt', data.id], data)

      toast({
        title: 'Quiz completed!',
        description: `You scored ${data.score}% (${data.correct_answers}/${data.total_questions} correct)`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to complete quiz',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    },
  })
}
