/**
 * React Query hooks for product file upload operations
 *
 * Provides hooks for:
 * - Requesting upload URLs
 * - Uploading files to S3 with progress tracking
 * - Adding files to products
 * - Complete upload workflow orchestration
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import {
  requestFileUploadURLs,
  uploadFileToS3,
  addFilesToProduct,
  type FileUploadURLRequest,
  type UploadURLResponse,
  type StagedFileInfo,
  type AddFilesToProductResponse,
  type FileType,
} from '@/lib/product-files.service'

// ============================================================================
// Individual Step Hooks
// ============================================================================

/**
 * Hook for requesting upload URLs (Step 1)
 */
export function useRequestFileUploadURLs() {
  return useMutation({
    mutationFn: async (files: FileUploadURLRequest[]) => {
      console.log('useRequestFileUploadURLs: Starting mutation', {
        fileCount: files.length,
      })
      const result = await requestFileUploadURLs(files)
      console.log('useRequestFileUploadURLs: Mutation successful', {
        urlCount: result.uploadURLs.length,
      })
      return result
    },
    onError: (error) => {
      console.error('useRequestFileUploadURLs: Mutation failed', error)
    },
  })
}

/**
 * Hook for uploading a single file to S3 (Step 2)
 */
export function useUploadFileToS3() {
  return useMutation({
    mutationFn: ({
      uploadURL,
      file,
      onProgress,
    }: {
      uploadURL: string
      file: File
      onProgress?: (progress: number) => void
    }) => uploadFileToS3(uploadURL, file, onProgress),
    onError: (error) => {
      console.error('useUploadFileToS3: Mutation failed', error)
    },
  })
}

/**
 * Hook for adding files to product (Step 3)
 */
export function useAddFilesToProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      stagedFiles,
    }: {
      productId: string
      stagedFiles: StagedFileInfo[]
    }) => addFilesToProduct(productId, stagedFiles),
    onSuccess: (data, variables) => {
      const productId = variables.productId

      console.log('useAddFilesToProduct: Files added successfully, invalidating queries', {
        productId,
        fileCount: data.files.length,
      })

      // Invalidate product queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId, 'files'] })
    },
    onError: (error) => {
      console.error('useAddFilesToProduct: Mutation failed', error)
    },
  })
}

// ============================================================================
// Combined Upload Flow Hook
// ============================================================================

/**
 * File with upload progress tracking
 */
export interface FileWithProgress {
  file: File
  fileType: FileType
  uploadId?: string
  stagingKey?: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  error?: string
}

/**
 * Overall upload flow state
 */
export interface UploadFlowState {
  step: 'idle' | 'requesting-urls' | 'uploading' | 'finalizing' | 'completed' | 'error'
  overallProgress: number
  filesWithProgress: FileWithProgress[]
  error?: string
}

/**
 * Combined hook for complete file upload workflow
 *
 * Orchestrates all 3 steps:
 * 1. Request upload URLs
 * 2. Upload files to S3 (parallel with progress tracking)
 * 3. Add files to product
 *
 * @returns Upload flow control and state
 */
export function useAddFilesToProductFlow() {
  const requestURLs = useRequestFileUploadURLs()
  const addFiles = useAddFilesToProduct()

  const [uploadState, setUploadState] = useState<UploadFlowState>({
    step: 'idle',
    overallProgress: 0,
    filesWithProgress: [],
  })

  /**
   * Execute complete upload workflow
   */
  const uploadFiles = useCallback(
    async (
      productId: string,
      files: Array<{ file: File; fileType: FileType }>
    ): Promise<AddFilesToProductResponse> => {
      try {
        // Initialize file progress tracking
        const filesWithProgress: FileWithProgress[] = files.map(({ file, fileType }) => ({
          file,
          fileType,
          progress: 0,
          status: 'pending' as const,
        }))

        setUploadState({
          step: 'requesting-urls',
          overallProgress: 0,
          filesWithProgress,
        })

        // Step 1: Request upload URLs
        console.log('useAddFilesToProductFlow: Step 1 - Requesting upload URLs', {
          productId,
          fileCount: files.length,
        })

        const urlRequest: FileUploadURLRequest[] = files.map(({ file, fileType }) => ({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileType,
        }))

        const response = await requestURLs.mutateAsync(urlRequest)

        // Validate response
        if (!response || !response.uploadURLs || !Array.isArray(response.uploadURLs)) {
          throw new Error('Invalid response from upload URL request')
        }

        const { uploadURLs } = response

        // Validate array lengths match
        if (uploadURLs.length !== files.length) {
          throw new Error(
            `Mismatch in file count: requested ${files.length} URLs but received ${uploadURLs.length}`
          )
        }

        console.log('useAddFilesToProductFlow: Received upload URLs', {
          count: uploadURLs.length,
          urls: uploadURLs.map((u) => ({ uploadId: u.uploadId, fileName: u.fileName })),
        })

        // Update files with upload IDs and staging keys
        const updatedFiles = filesWithProgress.map((fileData, index) => {
          const uploadInfo = uploadURLs[index]
          if (!uploadInfo) {
            throw new Error(`Missing upload info for file at index ${index}`)
          }
          return {
            ...fileData,
            uploadId: uploadInfo.uploadId,
            stagingKey: uploadInfo.stagingKey,
            status: 'uploading' as const,
          }
        })

        setUploadState({
          step: 'uploading',
          overallProgress: 10,
          filesWithProgress: updatedFiles,
        })

        // Step 2: Upload files to S3 in parallel
        console.log('useAddFilesToProductFlow: Step 2 - Uploading files to S3', {
          fileCount: files.length,
        })

        const uploadPromises = files.map(async ({ file }, index) => {
          const uploadInfo = uploadURLs[index]
          if (!uploadInfo || !uploadInfo.uploadURL) {
            throw new Error(`Missing upload URL for file: ${file.name}`)
          }

          return uploadFileToS3(uploadInfo.uploadURL, file, (progress) => {
            // Update individual file progress
            setUploadState((prev) => {
              const updated = [...prev.filesWithProgress]
              updated[index] = { ...updated[index], progress }

              // Calculate overall progress (10% for URLs, 80% for upload, 10% for finalizing)
              const totalProgress = updated.reduce((sum, f) => sum + f.progress, 0)
              const avgProgress = totalProgress / updated.length
              const overallProgress = 10 + Math.round(avgProgress * 0.8)

              return {
                ...prev,
                overallProgress,
                filesWithProgress: updated,
              }
            })
          })
        })

        await Promise.all(uploadPromises)

        // Mark all files as completed upload
        const completedFiles = updatedFiles.map((f) => ({
          ...f,
          progress: 100,
          status: 'completed' as const,
        }))

        setUploadState({
          step: 'finalizing',
          overallProgress: 90,
          filesWithProgress: completedFiles,
        })

        // Step 3: Add files to product
        console.log('useAddFilesToProductFlow: Step 3 - Adding files to product', {
          productId,
        })

        const stagedFiles: StagedFileInfo[] = files.map(({ file, fileType }, index) => ({
          uploadId: uploadURLs[index].uploadId,
          stagingKey: uploadURLs[index].stagingKey,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileType,
        }))

        const result = await addFiles.mutateAsync({ productId, stagedFiles })

        setUploadState({
          step: 'completed',
          overallProgress: 100,
          filesWithProgress: completedFiles,
        })

        console.log('useAddFilesToProductFlow: Upload flow completed successfully', {
          productId,
          fileCount: result.files.length,
        })

        return result
      } catch (error) {
        console.error('useAddFilesToProductFlow: Upload flow failed', error)

        setUploadState((prev) => ({
          ...prev,
          step: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        }))

        throw error
      }
    },
    [requestURLs, addFiles]
  )

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setUploadState({
      step: 'idle',
      overallProgress: 0,
      filesWithProgress: [],
    })
  }, [])

  return {
    uploadFiles,
    reset,
    state: uploadState,
    isPending:
      uploadState.step === 'requesting-urls' ||
      uploadState.step === 'uploading' ||
      uploadState.step === 'finalizing',
    isSuccess: uploadState.step === 'completed',
    isError: uploadState.step === 'error',
    error: uploadState.error,
  }
}
