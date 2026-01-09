/**
 * Content Generation API Service
 * Based on: docs/api/content-generation-api.md
 */

import { makeAuthenticatedRequest, handleApiResponse } from './api-utils'

// Re-export all types
export type {
  AudienceType,
  QuizDifficulty,
  ContentType,
  GenerationStatus,
  WorkflowState,
  QuestionOption,
  QuizQuestion,
  QuizContent,
  GenerateQuizRequest,
  GenerateQuizResponse,
  Generation,
  ListGenerationsResponse,
  UpdateContentRequest,
  UpdateContentResponse,
  PublishResponse,
} from './types/generated-content'

import type {
  GenerateQuizRequest,
  GenerateQuizResponse,
  Generation,
  ListGenerationsResponse,
  UpdateContentRequest,
  UpdateContentResponse,
  PublishResponse,
} from './types/generated-content'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'

/**
 * Generate quiz from product IFU
 * POST /api/v1/content/generate-quiz
 */
export async function generateQuiz(
  request: GenerateQuizRequest
): Promise<GenerateQuizResponse> {
  const response = await makeAuthenticatedRequest(
    `${API_BASE}/api/v1/content/generate-quiz`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  )

  return handleApiResponse(response)
}

/**
 * List all generations for current user (across all products)
 * GET /api/v1/content/generations
 */
export async function listAllGenerations(
  params?: { limit?: number; offset?: number }
): Promise<ListGenerationsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.offset) searchParams.append('offset', params.offset.toString())

  const url = `${API_BASE}/api/v1/content/generations${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`

  const response = await makeAuthenticatedRequest(url)
  return handleApiResponse(response)
}

/**
 * List all generations for a specific product
 * GET /api/v1/content/products/{product_id}/generations
 */
export async function listGenerations(
  productId: string,
  params?: { limit?: number; offset?: number }
): Promise<ListGenerationsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.offset) searchParams.append('offset', params.offset.toString())

  const url = `${API_BASE}/api/v1/content/products/${productId}/generations${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`

  const response = await makeAuthenticatedRequest(url)
  return handleApiResponse(response)
}

/**
 * Get single generation by ID
 * GET /api/v1/content/generations/{id}
 */
export async function getGeneration(id: string): Promise<Generation> {
  const response = await makeAuthenticatedRequest(
    `${API_BASE}/api/v1/content/generations/${id}`
  )
  return handleApiResponse(response)
}

/**
 * Update generation content
 * PUT /api/v1/content/generations/{id}
 */
export async function updateGeneration(
  id: string,
  request: UpdateContentRequest
): Promise<UpdateContentResponse> {
  const response = await makeAuthenticatedRequest(
    `${API_BASE}/api/v1/content/generations/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  )

  return handleApiResponse(response)
}

/**
 * Publish generation
 * POST /api/v1/content/generations/{id}/publish
 */
export async function publishGeneration(id: string): Promise<PublishResponse> {
  const response = await makeAuthenticatedRequest(
    `${API_BASE}/api/v1/content/generations/${id}/publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  )

  return handleApiResponse(response)
}

/**
 * Content Generation API Client
 */
export const contentGenerationApiClient = {
  generateQuiz,
  listAllGenerations,
  listGenerations,
  getGeneration,
  updateGeneration,
  publishGeneration,
}
