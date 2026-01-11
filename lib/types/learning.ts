/**
 * Learning API Types
 *
 * Type definitions for the Learning API module, which handles:
 * - Quiz taking and attempts
 * - Answer submission and feedback
 * - Progress tracking
 *
 * Separate from Content Generation API (which handles quiz creation/editing)
 */

import type { QuizQuestion } from './generated-content'

// ============================================================================
// Backend DTOs (Raw API Response Types)
// ============================================================================

/**
 * Backend QuizSummaryDTO - Raw response from GET /products/{id}/quizzes
 * Note: Missing user attempt statistics - requires backend changes
 */
export interface QuizSummaryDTO {
  id: string
  product_id: string
  title: string
  difficulty: string
  question_count: number
  quiz_type: string
  generation_id: string
  generated_at: string
  generated_by: string
  created_at: string
}

/**
 * Backend StartQuizAttemptResponse - Raw response from POST /quizzes/{id}/attempts
 */
export interface StartQuizAttemptResponse {
  attempt_id: string  // Note: Backend uses "attempt_id" not "id"
  quiz_id: string
  started_at: string
  status: string
}

/**
 * Backend AnswerDTO - Raw response from GET /quiz-attempts/{id}
 */
export interface AnswerDTO {
  id: string
  question_id: string          // Note: Backend uses UUID, not position number
  user_answer: number          // Note: Backend uses "user_answer" not "selected_option_index"
  is_correct: boolean
  answered_at: string
  time_taken_seconds: number
}

/**
 * Backend CompleteQuizResponse - Raw response from POST /quiz-attempts/{id}/complete
 */
export interface CompleteQuizResponse {
  attempt_id: string           // Note: Backend uses "attempt_id" not "id"
  status: string
  score: number
  correct_answers: number
  total_questions: number
  completed_at: string
  passed: boolean              // Extra field from backend
}

/**
 * Backend QuizAttemptDTO - Raw response from GET /quiz-attempts/{id}
 */
export interface QuizAttemptDTO {
  id: string
  quiz_id: string
  user_id: string
  organisation_id: string
  started_at: string
  completed_at: string
  score: number
  status: string
  created_at: string
  answers: AnswerDTO[]
}

/**
 * Backend QuestionDTO - Raw question from backend (has id field)
 * Extended version of QuizQuestion with id
 */
export interface QuestionDTO {
  id: string
  text: string
  type: 'multiple_choice' | 'true_false'
  options: Array<{ index: number; text: string }>
  correct_answer: number
  explanation: string
  position: number
}

// ============================================================================
// Frontend Types (Used in Components)
// ============================================================================

// Quiz attempt status
export type QuizAttemptStatus = 'in_progress' | 'completed'

// Quiz completion status from user perspective
export type QuizCompletionStatus = 'not_started' | 'in_progress' | 'completed'

/**
 * Quiz Attempt
 * Represents a single attempt at taking a quiz
 */
export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  started_at: string
  completed_at?: string
  score?: number
  total_questions: number
  correct_answers?: number
  status: QuizAttemptStatus
}

/**
 * Quiz Answer
 * Individual answer submission for a question
 */
export interface QuizAnswer {
  question_position: number
  selected_option_index: number
  is_correct: boolean
  answered_at: string
}

/**
 * Quiz Attempt with Answers
 * Complete attempt record including all answers
 */
export interface QuizAttemptWithAnswers extends QuizAttempt {
  answers: QuizAnswer[]
}

/**
 * Answer Submission Request
 * Payload for submitting an answer
 */
export interface AnswerSubmission {
  question_position: number
  selected_option_index: number
}

/**
 * Answer Submission Response
 * Immediate feedback after submitting an answer
 */
export interface AnswerFeedback {
  is_correct: boolean
  explanation: string
}

/**
 * Learning Quiz
 * Quiz metadata from learning API (list view)
 */
export interface LearningQuiz {
  id: string
  product_id: string
  product_name: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  question_count: number
  estimated_time_minutes: number
  created_at: string
  // User-specific fields
  last_attempt_score?: number
  attempt_count: number
  best_score?: number
  completion_status: QuizCompletionStatus
}

/**
 * Quiz Detail
 * Full quiz data including questions (detail view)
 * Note: Uses QuestionDTO from backend (has id field unlike QuizQuestion from content-generation)
 */
export interface QuizDetail {
  id: string
  product_id: string
  product_name: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questions: QuestionDTO[]  // Backend returns QuestionDTO with id field
}

/**
 * Product Quiz Stats
 * Summary statistics for quizzes in a product
 */
export interface ProductQuizStats {
  product_id: string
  product_name: string
  total_quizzes: number
  completed_quizzes: number
  in_progress_quizzes: number
  average_score?: number
  completion_percentage: number
}

/**
 * User Quiz Stats
 * Overall user statistics across all quizzes
 */
export interface UserQuizStats {
  total_quizzes: number
  completed_quizzes: number
  in_progress_quizzes: number
  total_attempts: number
  average_score?: number
  completion_rate: number
}

// ============================================================================
// Transformation Utilities
// ============================================================================

/**
 * Transform backend StartQuizAttemptResponse to frontend QuizAttempt
 */
export function transformStartAttemptResponse(
  response: StartQuizAttemptResponse,
  totalQuestions: number
): QuizAttempt {
  return {
    id: response.attempt_id,  // Map attempt_id → id
    quiz_id: response.quiz_id,
    user_id: '',  // Not provided by backend yet
    started_at: response.started_at,
    status: response.status as QuizAttemptStatus,
    total_questions: totalQuestions,
  }
}

/**
 * Transform backend CompleteQuizResponse to frontend QuizAttemptWithAnswers
 * Note: Backend doesn't include answers array yet, so we pass empty array
 */
export function transformCompleteQuizResponse(
  response: CompleteQuizResponse,
  quizId: string,
  startedAt: string,
  answers: QuizAnswer[] = []
): QuizAttemptWithAnswers {
  return {
    id: response.attempt_id,  // Map attempt_id → id
    quiz_id: quizId,
    user_id: '',  // Not provided by backend
    started_at: startedAt,
    completed_at: response.completed_at,
    score: response.score,
    total_questions: response.total_questions,
    correct_answers: response.correct_answers,
    status: response.status as QuizAttemptStatus,
    answers,
  }
}

/**
 * Transform backend AnswerDTO to frontend QuizAnswer
 * Note: Requires question lookup to map question_id → position
 */
export function transformAnswerDTO(
  dto: AnswerDTO,
  questions: Array<{ id: string; position: number }>
): QuizAnswer {
  const question = questions.find(q => q.id === dto.question_id)
  return {
    question_position: question?.position ?? 0,
    selected_option_index: dto.user_answer,  // Map user_answer → selected_option_index
    is_correct: dto.is_correct,
    answered_at: dto.answered_at,
  }
}

/**
 * Transform backend QuizAttemptDTO to frontend QuizAttemptWithAnswers
 */
export function transformQuizAttemptDTO(
  dto: QuizAttemptDTO,
  questions: Array<{ id: string; position: number }>
): QuizAttemptWithAnswers {
  return {
    id: dto.id,
    quiz_id: dto.quiz_id,
    user_id: dto.user_id,
    started_at: dto.started_at,
    completed_at: dto.completed_at,
    score: dto.score,
    total_questions: questions.length,  // Calculate from questions
    correct_answers: dto.answers.filter(a => a.is_correct).length,
    status: dto.status as QuizAttemptStatus,
    answers: dto.answers.map(a => transformAnswerDTO(a, questions)),
  }
}
