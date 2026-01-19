import { handleApiResponse } from '../api-utils'
import { getSession } from 'next-auth/react'
import { AuthenticationError } from '../auth-error'

// Use Next.js proxy path - all requests go through /api/core which rewrites to backend
const API_PATH = '/api/core/v1/products'
const ENDPOINT = API_PATH

// Client-side authenticated request helper
async function makeClientAuthRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const session = await getSession()

  const token = (session as any)?.accessToken

  if (!token) {
    throw new AuthenticationError("No access token available")
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError(
      'Session expired. Please sign in again.',
      response.status
    )
  }

  return response
}

// File upload URL request
export interface FileUploadURLRequest {
  fileName: string
  fileSize: number
  mimeType: string
  fileType: 'ifu' | 'product_image' | 'marketing_video' | 'brochure' | 'technical_spec' | 'clinical_data'
}

// File upload URL response
export interface FileUploadURLResponse {
  uploadId: string
  fileName: string
  stagingKey: string
  uploadURL: string
  expiresAt: string
}

// Staged file reference (for product creation)
export interface StagedFileInfo {
  uploadId: string
  stagingKey: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: string
}

// Product creation request
export interface CreateProductRequest {
  name: string
  manufacturer: string
  model_number: string
  category: 'cardiovascular' | 'orthopedic' | 'neurology' | 'surgical' | 'diagnostic' | 'other'
  description?: string
  stagedFiles?: StagedFileInfo[]
}

// Product file info (from backend)
export interface ProductFileInfo {
  fileID: string
  fileName: string
  fileType: string
  fileSize: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  processingError?: string
  // Support multiple naming conventions
  file_id?: string
  file_name?: string
  file_type?: string
  file_size?: number
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
  download_url?: string
  processing_error?: string
}

// Product response (matches actual backend format with snake_case)
export interface ProductResponse {
  id: string
  organization_id?: string
  name: string
  manufacturer: string
  model_number: string
  category: string
  status: 'draft' | 'active' | 'archived'
  description: string
  created_at: string
  updated_at?: string
  files?: ProductFileInfo[]

  // Also support alternative naming conventions for compatibility
  productID?: string
  organizationID?: string
  modelNumber?: string
  createdAt?: string
  ProductID?: string
}

/**
 * API Functions
 */

/**
 * Step 1: Request pre-signed upload URLs for files
 */
export async function requestUploadURLs(
  files: FileUploadURLRequest[]
): Promise<{ uploadURLs: FileUploadURLResponse[] }> {
  const response = await makeClientAuthRequest(`${ENDPOINT}/files/upload-urls`, {
    method: 'POST',
    body: JSON.stringify({ files })
  })

  const data = await handleApiResponse(response)

  return data
}

/**
 * Step 2: Upload file directly to S3 using pre-signed URL
 * Returns upload progress via onProgress callback
 */
export async function uploadToS3( uploadURL: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
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
        reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`))
      }
    }

    const errorHandler = (event: ProgressEvent) => {
      // Clean up all event listeners to prevent memory leaks
      cleanup()

      reject(new Error('Upload failed due to network error. Check CORS settings.'))
    }

    const abortHandler = () => {
      // Clean up all event listeners to prevent memory leaks
      cleanup()

      reject(new Error('Upload was aborted'))
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

    // Fix LocalStack URL for browser access (development only)
    // In development, backend generates URLs with Docker internal hostnames
    // that need to be transformed for browser access
    let fixedURL = uploadURL

    // Check for custom S3 endpoint override (for LocalStack or other S3-compatible services)
    const s3EndpointOverride = process.env.NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE
    if (s3EndpointOverride) {
      // Replace the hostname in the URL with the override
      const url = new URL(uploadURL)
      const overrideUrl = new URL(s3EndpointOverride)
      url.protocol = overrideUrl.protocol
      url.host = overrideUrl.host
      fixedURL = url.toString()
    } else if (process.env.NODE_ENV === 'development' && uploadURL.includes('.localhost:4566')) {
      // Convert virtual-hosted-style to path-style for LocalStack
      // From: http://bucket.localhost:4566/path
      // To:   http://localhost:4566/bucket/path
      const match = uploadURL.match(/^(https?:\/\/)([^.]+)\.localhost:4566(\/.*)$/)
      if (match) {
        const [, protocol, bucket, path] = match
        fixedURL = `${protocol}localhost:4566/${bucket}${path}`
      } else {
        // Fallback: just replace subdomain
        fixedURL = uploadURL.replace(/https?:\/\/[^/]+\.localhost:4566/, 'http://localhost:4566')
      }
    }

    xhr.open('PUT', fixedURL)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

/**
 * Step 3: Create product with staged files
 */
export async function createProduct( data: CreateProductRequest): Promise<ProductResponse> {
  const response = await makeClientAuthRequest(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data)
  })

  const product = await handleApiResponse(response)
  return product
}

/**
 * Get product by ID (with file status)
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  const response = await makeClientAuthRequest(`${ENDPOINT}/${id}`)
  const product = await handleApiResponse(response)
  return product
}

/**
 * List all products
 */
export async function listProducts( status?: string, limit = 50, offset = 0): Promise<ProductResponse[]> {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  const url = `${ENDPOINT}?${params.toString()}`
  const response = await makeClientAuthRequest(url)
  const data = await handleApiResponse(response)
  if (Array.isArray(data)) {
    return data
  } else if (data && typeof data === 'object') {
    // Check for common wrapper properties (backend returns { products: [...], total_count: N, ... })
    const products = data.products || data.Products || data.data || data.Data
    if (Array.isArray(products)) {
      return products
    }
  }

  return []
}

/**
 * Export client object
 */
export const productApiClient = {
  requestUploadURLs,
  uploadToS3,
  createProduct,
  getProduct,
  listProducts,
}