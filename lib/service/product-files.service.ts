/**
 * Product Files API Service
 *
 * Handles file upload operations for existing products:
 * - Request presigned upload URLs
 * - Upload files to S3 with progress tracking
 * - Add files to product after upload
 */

import { makeAuthenticatedRequest, handleApiResponse } from '../api-utils'

// ============================================================================
// API Configuration
// ============================================================================

// Use Next.js proxy path - all requests go through /api/core which rewrites to backend
const CORE_API_BASE = '/api/core'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * File types supported by the system
 */
export type FileType =
  | 'ifu'              // Instructions For Use
  | 'technical_spec'   // Technical Specifications
  | 'clinical_data'    // Clinical Data/Studies
  | 'product_image'    // Product photos
  | 'marketing_video'  // Demo/promotional videos
  | 'brochure'         // Marketing brochures
  | 'other'            // Other supporting documents

/**
 * Processing status for uploaded files
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ============================================================================
// Step 1: Request Upload URLs
// ============================================================================

/**
 * File metadata for requesting upload URL
 */
export interface FileUploadURLRequest {
  fileName: string
  fileSize: number
  mimeType: string
  fileType: FileType
}

/**
 * Request body for upload URLs endpoint
 */
export interface RequestUploadURLsRequest {
  files: FileUploadURLRequest[]
}

/**
 * Response containing presigned upload URL (normalized to camelCase)
 */
export interface UploadURLResponse {
  uploadId: string
  fileName: string
  stagingKey: string
  uploadURL: string
  expiresAt: string
}

/**
 * Response from upload URLs endpoint (normalized to camelCase)
 */
export interface RequestUploadURLsResponse {
  uploadURLs: UploadURLResponse[]
}

/**
 * Request presigned S3 upload URLs for files
 *
 * @param files - Array of file metadata
 * @returns Presigned URLs with upload IDs and staging keys
 */
export async function requestFileUploadURLs(
  files: FileUploadURLRequest[]
): Promise<RequestUploadURLsResponse> {
  const response = await makeAuthenticatedRequest(
    `${CORE_API_BASE}/v1/products/files/upload-urls`,
    {
      method: 'POST',
      body: JSON.stringify({ files })
    }
  )

  const result = await handleApiResponse(response)

  // Go backend returns PascalCase (no json tags): UploadURLs
  const uploadURLs = result.UploadURLs

  // Validate response structure
  if (!uploadURLs || !Array.isArray(uploadURLs)) {
    throw new Error('Invalid response: missing or invalid UploadURLs array')
  }

  // Normalize PascalCase response to camelCase
  const normalizedURLs: UploadURLResponse[] = uploadURLs.map((url: any, index: number) => {
    const normalized = {
      uploadId: url.UploadID || '',
      fileName: url.FileName || '',
      stagingKey: url.StagingKey || '',
      uploadURL: url.UploadURL || '',
      expiresAt: url.ExpiresAt || '',
    }

    // Validate required fields
    if (!normalized.uploadId || !normalized.stagingKey || !normalized.uploadURL) {
      throw new Error(`Invalid upload URL object at index ${index}: missing required fields`)
    }

    return normalized
  })

  return {
    uploadURLs: normalizedURLs,
  }
}

// ============================================================================
// Step 2: Upload to S3
// ============================================================================

/**
 * Progress callback function type
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * Upload a file to S3 using presigned URL with progress tracking
 *
 * @param uploadURL - Presigned S3 URL
 * @param file - File to upload
 * @param onProgress - Optional progress callback (0-100)
 * @returns Promise that resolves when upload completes
 */
export async function uploadFileToS3(
  uploadURL: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Store event handler references for cleanup (prevent memory leaks)
    const progressHandler = (event: ProgressEvent) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress(percentComplete)
      }
    }

    const loadHandler = () => {
      // Clean up all event listeners to prevent memory leaks
      cleanup()

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        const error = new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`)
        reject(error)
      }
    }

    const errorHandler = () => {
      // Clean up all event listeners to prevent memory leaks
      cleanup()

      const error = new Error(`Network error during upload of ${file.name}`)
      reject(error)
    }

    const abortHandler = () => {
      // Clean up all event listeners to prevent memory leaks
      cleanup()

      const error = new Error(`Upload aborted for ${file.name}`)
      reject(error)
    }

    // Cleanup function to remove all event listeners
    const cleanup = () => {
      xhr.upload.removeEventListener('progress', progressHandler)
      xhr.removeEventListener('load', loadHandler)
      xhr.removeEventListener('error', errorHandler)
      xhr.removeEventListener('abort', abortHandler)
    }

    // Attach event listeners
    xhr.upload.addEventListener('progress', progressHandler)
    xhr.addEventListener('load', loadHandler)
    xhr.addEventListener('error', errorHandler)
    xhr.addEventListener('abort', abortHandler)

    // Transform LocalStack URL in development
    let finalUploadURL = uploadURL
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE) {
      const url = new URL(uploadURL)
      const localstackEndpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE
      finalUploadURL = uploadURL.replace(url.origin, localstackEndpoint)
    }

    // Start upload
    xhr.open('PUT', finalUploadURL)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

// ============================================================================
// Step 3: Add Files to Product
// ============================================================================

/**
 * Staged file information after S3 upload
 */
export interface StagedFileInfo {
  uploadId: string
  stagingKey: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: FileType
}

/**
 * Request body for adding files to product
 */
export interface AddFilesToProductRequest {
  stagedFiles: StagedFileInfo[]
}

/**
 * Product file information from API response (normalized to camelCase)
 */
export interface ProductFileInfo {
  fileId: string
  fileName: string
  fileType: FileType
  fileSize: number
  processingStatus: ProcessingStatus
}

/**
 * Response from add files to product endpoint (normalized to camelCase)
 */
export interface AddFilesToProductResponse {
  productId: string
  files: ProductFileInfo[]
}

/**
 * Add uploaded files to an existing product
 *
 * @param productId - Product ID
 * @param stagedFiles - Array of staged file information
 * @returns Product ID and file information
 */
export async function addFilesToProduct(
  productId: string,
  stagedFiles: StagedFileInfo[]
): Promise<AddFilesToProductResponse> {
  // Send camelCase as per Go backend json tags
  const response = await makeAuthenticatedRequest(
    `${CORE_API_BASE}/v1/products/${productId}/files`,
    {
      method: 'POST',
      body: JSON.stringify({ stagedFiles })
    }
  )

  const result = await handleApiResponse(response)

  // Go backend returns PascalCase (no json tags): ProductID, Files
  const resultProductId = result.ProductID
  const files = result.Files || []

  // Normalize PascalCase response to camelCase
  const normalizedFiles: ProductFileInfo[] = files.map((file: any) => ({
    fileId: file.FileID || '',
    fileName: file.FileName || '',
    fileType: (file.FileType as FileType) || 'other',
    fileSize: file.FileSize || 0,
    processingStatus: (file.ProcessingStatus as ProcessingStatus) || 'pending',
  }))

  return {
    productId: resultProductId,
    files: normalizedFiles,
  }
}

// ============================================================================
// Client Object Export
// ============================================================================

/**
 * Product Files API client
 *
 * Provides organized access to all file-related API functions
 */
export const productFilesClient = {
  requestUploadURLs: requestFileUploadURLs,
  uploadToS3: uploadFileToS3,
  addFiles: addFilesToProduct,
}

export default productFilesClient
