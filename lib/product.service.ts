import { makeAuthenticatedRequest, handleApiResponse, getCurrentUserId } from './api-utils'

// Environment-based API URL
const CORE_API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5002/api'
  : process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:5002/api'

const API_PATH = '/v1/products'
const ENDPOINT = CORE_API_BASE + API_PATH

console.log('Product Service Config:', {
  NODE_ENV: process.env.NODE_ENV,
  CORE_API_BASE,
  API_PATH,
  ENDPOINT,
  NEXT_PUBLIC_CORE_API_URL: process.env.NEXT_PUBLIC_CORE_API_URL
})

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
  try {
    console.log('requestUploadURLs: Requesting URLs for', files.length, 'files')

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/files/upload-urls`, {
      method: 'POST',
      body: JSON.stringify({ files })
    })

    const data = await handleApiResponse(response)
    console.log('requestUploadURLs: Response data:', data)

    return data
  } catch (error) {
    console.error('Error requesting upload URLs:', error)
    throw error
  }
}

/**
 * Step 2: Upload file directly to S3 using pre-signed URL
 * Returns upload progress via onProgress callback
 */
export async function uploadToS3(
  uploadURL: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress(percentComplete)
      }
    })

    xhr.addEventListener('load', () => {
      console.log('uploadToS3: Load event - status:', xhr.status, 'statusText:', xhr.statusText)
      console.log('uploadToS3: Response:', xhr.responseText)

      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('uploadToS3: Upload successful for', file.name)
        resolve()
      } else {
        console.error('uploadToS3: Upload failed with status', xhr.status, xhr.statusText)
        console.error('uploadToS3: Response:', xhr.responseText)
        reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', (event) => {
      console.error('uploadToS3: Network error during upload')
      console.error('uploadToS3: Error event:', event)
      console.error('uploadToS3: XHR status:', xhr.status)
      console.error('uploadToS3: XHR response:', xhr.responseText)
      reject(new Error('Upload failed due to network error. Check CORS settings.'))
    })

    xhr.addEventListener('abort', () => {
      console.error('uploadToS3: Upload aborted')
      reject(new Error('Upload was aborted'))
    })

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
      console.log('uploadToS3: Using S3 endpoint override:', fixedURL)
    } else if (process.env.NODE_ENV === 'development' && uploadURL.includes('.localhost:4566')) {
      // Convert virtual-hosted-style to path-style for LocalStack
      // From: http://bucket.localhost:4566/path
      // To:   http://localhost:4566/bucket/path
      const match = uploadURL.match(/^(https?:\/\/)([^.]+)\.localhost:4566(\/.*)$/)
      if (match) {
        const [, protocol, bucket, path] = match
        fixedURL = `${protocol}localhost:4566/${bucket}${path}`
        console.log('uploadToS3: Converted to path-style URL:', fixedURL)
      } else {
        // Fallback: just replace subdomain
        fixedURL = uploadURL.replace(/https?:\/\/[^/]+\.localhost:4566/, 'http://localhost:4566')
        console.log('uploadToS3: Transformed Docker URL (fallback):', fixedURL)
      }
    }

    console.log('uploadToS3: Starting upload for', file.name, '(', file.size, 'bytes)')
    console.log('uploadToS3: Upload URL:', fixedURL)
    console.log('uploadToS3: File type:', file.type)

    xhr.open('PUT', fixedURL)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

/**
 * Step 3: Create product with staged files
 */
export async function createProduct(
  data: CreateProductRequest
): Promise<ProductResponse> {
  try {
    console.log('createProduct: Creating product:', data.name)

    const response = await makeAuthenticatedRequest(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(data)
    })

    const product = await handleApiResponse(response)
    console.log('createProduct: Product created with ID:', product.productID)

    return product
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Get product by ID (with file status)
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  try {
    console.log('getProduct: Fetching product:', id)

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/${id}`)

    const product = await handleApiResponse(response)
    console.log('getProduct: Retrieved product:', product.name)

    return product
  } catch (error) {
    console.error('Error getting product:', error)
    throw error
  }
}

/**
 * List all products
 */
export async function listProducts(
  status?: string,
  limit = 50,
  offset = 0
): Promise<ProductResponse[]> {
  try {
    const url = new URL(ENDPOINT)
    if (status) url.searchParams.append('status', status)
    url.searchParams.append('limit', limit.toString())
    url.searchParams.append('offset', offset.toString())

    console.log('listProducts: Making GET request to:', url.toString())

    const response = await makeAuthenticatedRequest(url.toString())

    console.log('listProducts: Response status:', response.status)

    const data = await handleApiResponse(response)
    console.log('listProducts: Raw response data:', data)
    console.log('listProducts: Data type:', typeof data, 'Is array:', Array.isArray(data))

    // Handle different response formats
    if (Array.isArray(data)) {
      console.log('listProducts: Retrieved', data.length, 'products (direct array)')
      return data
    } else if (data && typeof data === 'object') {
      // Check for common wrapper properties (backend returns { products: [...], total_count: N, ... })
      const products = data.products || data.Products || data.data || data.Data
      if (Array.isArray(products)) {
        console.log('listProducts: Retrieved', products.length, 'products (from wrapper property)')
        console.log('listProducts: Total count:', data.total_count || data.totalCount || 'unknown')
        return products
      }
    }

    console.warn('listProducts: Unexpected response format, returning empty array. Data:', data)
    return []
  } catch (error) {
    console.error('Error listing products:', error)
    throw error
  }
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