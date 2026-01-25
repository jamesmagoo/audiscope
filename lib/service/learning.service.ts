/**
 * Learning API Service
 *
 * Service layer for the Learning API module.
 * Handles quiz taking, answer submission, and progress tracking.
 *
 * Separate from Content Generation API (content-generation.service.ts)
 */

import { makeAuthenticatedRequest, handleApiResponse } from '../api-utils'
import type {
  LearningQuiz,
  QuizDetail,
  QuizAttempt,
  QuizAttemptWithAnswers,
  AnswerSubmission,
  AnswerFeedback,
  ProductQuizStats,
  UserQuizStats,
  StartQuizAttemptResponse,
  CompleteQuizResponse,
  QuizAttemptDTO,
  QuizAttemptStatus,
} from '../types/learning'
import {
  transformStartAttemptResponse,
  transformCompleteQuizResponse,
  transformQuizAttemptDTO,
} from '../types/learning'

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
    body: JSON.stringify({
      quiz_id: quizId, // Backend requires quiz_id in request body
    }),
  })
  const backendResponse: StartQuizAttemptResponse = await handleApiResponse(response)

  // Get quiz details to find total_questions (backend doesn't provide this yet)
  const quiz = await getQuizDetail(quizId)

  return transformStartAttemptResponse(backendResponse, quiz.questions.length)
}

/**
 * Submit an answer for a question in the current attempt
 * POST /api/v1/learning/quiz-attempts/{attemptID}/answers
 */
export async function submitAnswer(
  attemptId: string,
  answer: AnswerSubmission,
  questionId: string
): Promise<AnswerFeedback> {
  const url = `${API_PATH}/quiz-attempts/${attemptId}/answers`

  // Transform frontend format to backend format
  const backendRequest = {
    question_id: questionId,
    selected_option_index: answer.selected_option_index,
  }

  const response = await makeAuthenticatedRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendRequest),
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
    body: JSON.stringify({}), // Backend expects empty JSON body
  })
  const backendResponse: CompleteQuizResponse = await handleApiResponse(response)

  // Get full attempt details to get answers and other fields
  // (backend CompleteQuizResult doesn't include answers array yet)
  const fullAttempt = await getAttemptResults(backendResponse.attempt_id)

  return fullAttempt
}

/**
 * Get quiz attempt results
 * GET /api/v1/learning/quiz-attempts/{attemptID}
 *
 * @param attemptId - The quiz attempt ID
 * @param quizData - Optional pre-fetched quiz data to avoid duplicate fetch
 */
export async function getAttemptResults(
  attemptId: string,
  quizData?: QuizDetail
): Promise<QuizAttemptWithAnswers> {
  const url = `${API_PATH}/quiz-attempts/${attemptId}`
  const response = await makeAuthenticatedRequest(url)
  const backendAttempt: QuizAttemptDTO = await handleApiResponse(response)

  // Use provided quiz data or fetch it
  const quiz = quizData || await getQuizDetail(backendAttempt.quiz_id)
  const questionMap = quiz.questions.map((q, idx) => ({ id: q.id, position: idx }))

  return transformQuizAttemptDTO(backendAttempt, questionMap)
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

// Removed getQuizAttempts function - was causing infinite loop
// The endpoint GET /api/v1/learning/quizzes/{quizID}/attempts is not implemented in backend yet
// If needed in future, re-add with proper error handling

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
 *
 * Note: Backend AttemptSummaryDTO doesn't include total_questions,
 * so we set it to 0 as a placeholder. Use getAttemptResults() for full details.
 */
export async function getUserAttempts(): Promise<QuizAttempt[]> {
  const url = `${API_PATH}/users/me/attempts`
  const response = await makeAuthenticatedRequest(url)
  const data = await handleApiResponse(response)
  const attempts = data.attempts || data || []

  // Transform backend AttemptSummaryDTO to frontend QuizAttempt
  return attempts.map((attempt: any) => ({
    id: attempt.id,
    quiz_id: attempt.quiz_id,
    user_id: '', // Not provided by backend
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
    score: attempt.score,
    total_questions: 0, // Backend doesn't provide this in summary
    status: attempt.status as QuizAttemptStatus,
  }))
}
