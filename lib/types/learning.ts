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
 */
export interface QuizDetail {
  id: string
  product_id: string
  product_name: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questions: QuizQuestion[]
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
