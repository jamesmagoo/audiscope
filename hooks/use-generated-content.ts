/**
 * React Query hooks for Content Generation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  contentGenerationApiClient,
  type GenerateQuizRequest,
  type UpdateContentRequest,
} from '@/lib/service/content-generation.service'

/**
 * List all generations for current user (across all products)
 */
export function useAllGenerations(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['all-generations', params],
    queryFn: () => contentGenerationApiClient.listAllGenerations(params),
  })
}

/**
 * List generations for a specific product
 */
export function useGenerations(productId: string | null, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['generations', productId, params],
    queryFn: () => productId ? contentGenerationApiClient.listGenerations(productId, params) : null,
    enabled: !!productId,
  })
}

/**
 * Get single generation by ID
 */
export function useGeneration(id: string | null) {
  return useQuery({
    queryKey: ['generation', id],
    queryFn: () => id ? contentGenerationApiClient.getGeneration(id) : null,
    enabled: !!id,
  })
}

/**
 * Generate quiz mutation
 */
export function useGenerateQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GenerateQuizRequest) =>
      contentGenerationApiClient.generateQuiz(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generations'] })

      if (data.status === 'success') {
        toast.success('Quiz generated successfully!')
      } else if (data.status === 'partial') {
        toast.success('Quiz generated with some warnings', {
          description: 'Review the content before publishing'
        })
      }

      return data
    },
    onError: (error: any) => {
      console.error('Quiz generation error:', error)
      const message = error.message || 'Failed to generate quiz'
      toast.error('Generation Failed', {
        description: message
      })
    },
  })
}

/**
 * Update generation mutation
 */
export function useUpdateGeneration(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateContentRequest) =>
      contentGenerationApiClient.updateGeneration(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation', id] })
      queryClient.invalidateQueries({ queryKey: ['generations'] })
      toast.success('Content saved successfully')
    },
    onError: (error: any) => {
      console.error('Update error:', error)
      const message = error.message || 'Failed to update content'
      toast.error('Save Failed', {
        description: message
      })
    },
  })
}

/**
 * Publish generation mutation
 */
export function usePublishGeneration(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => contentGenerationApiClient.publishGeneration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation', id] })
      queryClient.invalidateQueries({ queryKey: ['generations'] })
      toast.success('Content published successfully!', {
        description: 'Quiz is now available in Learning Hub'
      })
    },
    onError: (error: any) => {
      console.error('Publish error:', error)
      const message = error.message || 'Failed to publish content'
      toast.error('Publish Failed', {
        description: message
      })
    },
  })
}
