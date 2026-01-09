/**
 * Generated Content Types - Matches Backend API
 * Based on: docs/api/content-generation-api.md
 */

// Audience types from backend
export type AudienceType = 'new_rep' | 'sales_rep' | 'trainer' | 'certification'

// Difficulty levels
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced'

// Content types
export type ContentType = 'quiz' | 'flashcard' | 'learning_module'

// Generation status
export type GenerationStatus = 'success' | 'partial' | 'failed'

// Workflow states
export type WorkflowState = 'draft' | 'edited' | 'published'

/**
 * Question option structure
 */
export interface QuestionOption {
  index: number
  text: string
}

/**
 * Quiz question from backend
 */
export interface QuizQuestion {
  text: string
  type: 'multiple_choice' | 'true_false'
  options: QuestionOption[]
  correct_answer: number
  explanation: string
  position: number
}

/**
 * Quiz content structure
 */
export interface QuizContent {
  title: string
  difficulty: string
  questions: QuizQuestion[]
}

/**
 * Request to generate quiz
 */
export interface GenerateQuizRequest {
  product_id: string
  audience_type: AudienceType
  difficulty?: QuizDifficulty
  question_count?: number
  focus_areas?: string[]
}

/**
 * Response from quiz generation
 */
export interface GenerateQuizResponse {
  generation_id: string
  status: GenerationStatus
  content?: QuizContent
  metadata: {
    tokens_used: number
    generation_time_ms: number
    model_id: string
  }
  error_message?: string
}

/**
 * Generated content record
 */
export interface Generation {
  id: string
  product_id: string
  product_name?: string  // Included in list endpoint via JOIN
  content_type: ContentType
  status: GenerationStatus
  workflow_state: WorkflowState
  content: QuizContent
  original_content?: QuizContent
  edited_by?: string
  edited_at?: string
  is_published: boolean
  published_by?: string
  published_at?: string
  created_at: string
}

/**
 * List generations response
 */
export interface ListGenerationsResponse {
  generations: Generation[]
  total: number
  limit: number
  offset: number
}

/**
 * Update content request
 */
export interface UpdateContentRequest {
  content: QuizContent
}

/**
 * Update content response
 */
export interface UpdateContentResponse {
  generation_id: string
  content: QuizContent
  workflow_state: WorkflowState
  edited_by: string
  edited_at: string
}

/**
 * Publish response
 */
export interface PublishResponse {
  generation_id: string
  is_published: boolean
  workflow_state: WorkflowState
  published_by: string
  published_at: string
}
