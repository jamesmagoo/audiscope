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
  getProductQuizStats,
  getUserQuizStats,
  getUserAttempts,
} from '@/lib/service/learning.service'
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
 * List all quizzes across all products with optional status filter
 * Query key: ['learning', 'quizzes', status]
 *
 * Note: This aggregates quizzes from all products since the backend
 * doesn't have a global /quizzes endpoint yet.
 *
 * OPTIMIZATION: Checks React Query cache for products before fetching
 * to avoid duplicate API calls when used alongside useProducts()
 */
export function useAllQuizzes(status?: 'not_started' | 'in_progress' | 'completed') {
  const queryClient = useQueryClient()

  return useQuery<LearningQuiz[]>({
    queryKey: ['learning', 'quizzes', status],
    queryFn: async () => {
      // Check if products are already in cache (from useProducts hook)
      let products = queryClient.getQueryData<any[]>(['products'])

      if (!products) {
        const { listProducts } = await import('@/lib/service/product.service')
        products = await listProducts()
      }

      if (!products || products.length === 0) {
        return []
      }

      // Then fetch quizzes for each product in parallel
      const quizzesByProduct = await Promise.all(
        products.map(product => listProductQuizzes(product.id))
      )

      // Flatten and optionally filter by status
      const allQuizzes = quizzesByProduct.flat()
      if (status) {
        return allQuizzes.filter(quiz => quiz.completion_status === status)
      }
      return allQuizzes
    },
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
    staleTime: 1000 * 60 * 5, // Quiz details are stable, cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

/**
 * Get quiz attempt results
 * Query key: ['learning', 'attempt', attemptId]
 *
 * Note: This hook coordinates with useQuizDetail to avoid duplicate network requests.
 * It first fetches the attempt, then uses the quiz from cache if available.
 *
 * IMPORTANT: Attempt data is frequently updated (user answers questions), so we:
 * - Use very short staleTime (5 seconds)
 * - Always refetch on mount (to get latest answers when re-entering quiz)
 * - Don't refetch on window focus (to avoid unnecessary requests)
 */
export function useAttemptResults(attemptId: string | null, quizId?: string | null) {
  const queryClient = useQueryClient()

  return useQuery<QuizAttemptWithAnswers>({
    queryKey: ['learning', 'attempt', attemptId],
    queryFn: async () => {
      if (!attemptId) throw new Error('Attempt ID is required')

      // Try to get quiz from cache if quizId is provided
      let quizData = undefined
      if (quizId) {
        quizData = queryClient.getQueryData<QuizDetail>(['learning', 'quiz', quizId])
      }

      return getAttemptResults(attemptId, quizData)
    },
    enabled: !!attemptId,
    staleTime: 1000 * 5, // Only cache for 5 seconds (attempt updates frequently)
    refetchOnMount: true, // ✅ Always refetch when component mounts (re-entering quiz)
    refetchOnWindowFocus: false, // Don't refetch on every window focus
  })
}

// Removed useQuizAttempts hook - was causing infinite loop
// The getQuizAttempts endpoint is not implemented on backend yet
// If needed in future, re-add with proper retry guards

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

/**
 * Get all quiz attempts for the current user
 * Query key: ['learning', 'user-attempts']
 *
 * IMPORTANT: Attempts are frequently updated, so we:
 * - Use short staleTime (10 seconds)
 * - Refetch on mount (to detect active attempts when navigating)
 * - Don't refetch on window focus (avoid excessive requests)
 */
export function useUserAttempts() {
  return useQuery<QuizAttempt[]>({
    queryKey: ['learning', 'user-attempts'],
    queryFn: getUserAttempts,
    staleTime: 1000 * 10, // Only cache for 10 seconds (attempts update frequently)
    refetchOnMount: true, // ✅ Always refetch to detect active attempts
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
      // Removed quiz-attempts invalidation - was causing infinite loop
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
    { attemptId: string; answer: AnswerSubmission; questionId: string }
  >({
    mutationFn: ({ attemptId, answer, questionId }) => submitAnswer(attemptId, answer, questionId),
    // DON'T invalidate cache here - it causes auto-advance to next question!
    // The cache will be refreshed on next mount due to refetchOnMount: true
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
      // Removed quiz-attempts invalidation - was causing infinite loop
      queryClient.invalidateQueries({ queryKey: ['learning', 'product-stats'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['learning', 'user-attempts'] })

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
