/**
 * Learning API Service
 *
 * Service layer for the Learning API module.
 * Handles quiz taking, answer submission, and progress tracking.
 *
 * Separate from Content Generation API (content-generation.service.ts)
 */

import { makeAuthenticatedRequest, handleApiResponse } from './api-utils'
import type {
  LearningQuiz,
  QuizDetail,
  QuizAttempt,
  QuizAttemptWithAnswers,
  AnswerSubmission,
  AnswerFeedback,
  ProductQuizStats,
  UserQuizStats,
} from './types/learning'

// Use Next.js proxy path - all requests go through /api/core which rewrites to backend
const API_PATH = '/api/core/v1/learning'

/**
 * List quizzes for a specific product
 * GET /api/v1/learning/products/{productID}/quizzes
 */
export async function listProductQuizzes(productId: string): Promise<LearningQuiz[]> {
  const url = `${API_PATH}/products/${productId}/quizzes`
  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)
  return data.quizzes || []
}

/**
 * Get full quiz details including questions
 * GET /api/v1/learning/quizzes/{quizID}
 */
export async function getQuizDetail(quizId: string): Promise<QuizDetail> {
  const url = `${API_PATH}/quizzes/${quizId}`
  const response = await makeAuthenticatedRequest(url)
  return await handleApiResponse(response)
}

/**
 * Start a new quiz attempt
 * POST /api/v1/learning/quizzes/{quizID}/attempts
 */
export async function startQuizAttempt(quizId: string): Promise<QuizAttempt> {
  const url = `${API_PATH}/quizzes/${quizId}/attempts`
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await handleApiResponse(response)
}

/**
 * Submit an answer for a question in the current attempt
 * POST /api/v1/learning/quiz-attempts/{attemptID}/answers
 */
export async function submitAnswer(
  attemptId: string,
  answer: AnswerSubmission
): Promise<AnswerFeedback> {
  const url = `${API_PATH}/quiz-attempts/${attemptId}/answers`
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answer),
  })
  return await handleApiResponse(response)
}

/**
 * Complete the quiz attempt
 * POST /api/v1/learning/quiz-attempts/{attemptID}/complete
 */
export async function completeQuizAttempt(attemptId: string): Promise<QuizAttemptWithAnswers> {
  const url = `${API_PATH}/quiz-attempts/${attemptId}/complete`
  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await handleApiResponse(response)
}

/**
 * Get quiz attempt results
 * GET /api/v1/learning/quiz-attempts/{attemptID}
 */
export async function getAttemptResults(attemptId: string): Promise<QuizAttemptWithAnswers> {
  const url = `${API_PATH}/quiz-attempts/${attemptId}`
  const response = await makeAuthenticatedRequest(url)
  return await handleApiResponse(response)
}

// ============================================================================
// Additional API functions (for future endpoints)
// ============================================================================

/**
 * List all quizzes with optional status filter
 * GET /api/v1/learning/quizzes?status={status}
 * (Recommended additional endpoint - not yet implemented in backend)
 */
export async function listAllQuizzes(
  status?: 'not_started' | 'in_progress' | 'completed'
): Promise<LearningQuiz[]> {
  const params = new URLSearchParams()
  if (status) {
    params.append('status', status)
  }
  const url = `${API_PATH}/quizzes${params.toString() ? `?${params.toString()}` : ''}`
  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)
  return data.quizzes || []
}

/**
 * Get all attempts for a specific quiz
 * GET /api/v1/learning/quizzes/{quizID}/attempts
 * (Recommended additional endpoint - not yet implemented in backend)
 */
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const url = `${API_PATH}/quizzes/${quizId}/attempts`
  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)
  return data.attempts || []
}

/**
 * Get quiz statistics for a product
 * GET /api/v1/learning/stats/products/{productID}
 * (Recommended additional endpoint - not yet implemented in backend)
 */
export async function getProductQuizStats(productId: string): Promise<ProductQuizStats> {
  const url = `${API_PATH}/stats/products/${productId}`
  const response = await makeAuthenticatedRequest(url)
  return await handleApiResponse(response)
}

/**
 * Get overall user quiz statistics
 * GET /api/v1/learning/stats/user
 * (Recommended additional endpoint - not yet implemented in backend)
 */
export async function getUserQuizStats(): Promise<UserQuizStats> {
  const url = `${API_PATH}/stats/user`
  const response = await makeAuthenticatedRequest(url)
  return await handleApiResponse(response)
}

/**
 * Get all quiz attempts for the current user
 * GET /api/v1/learning/users/me/attempts
 */
export async function getUserAttempts(): Promise<QuizAttempt[]> {
  const url = `${API_PATH}/users/me/attempts`
  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)
  return data.attempts || data || []
}
