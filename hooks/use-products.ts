'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productApiClient,
  type CreateProductRequest,
  type ProductResponse,
  type FileUploadURLRequest,
  type StagedFileInfo
} from '@/lib/product.service'

/**
 * Query: Get product by ID
 */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => {
      console.log('useProduct: queryFn called at', new Date().toISOString())
      return id ? productApiClient.getProduct(id) : null
    },
    enabled: !!id,
    staleTime: 0, // Disable staleness for debugging
    refetchInterval: (query) => {
      // Poll every 5 seconds if files are still processing
      // Stop polling when all files are in terminal states (completed or failed)
      const data = query.state.data

      // Debug logging
      console.log('useProduct refetchInterval check:', {
        timestamp: new Date().toISOString(),
        hasData: !!data,
        filesCount: data?.files?.length || 0,
        files: data?.files
      })

      if (!data?.files || data.files.length === 0) {
        console.log('useProduct: No files, not polling')
        return false
      }

      const hasActiveProcessingFiles = data.files.some((f: any) => {
        const status = f.processing_status || f.processingStatus || f.ProcessingStatus
        const isActive = status === 'pending' || status === 'processing'
        console.log('File status check:', {
          fileName: f.file_name || f.fileName || f.FileName,
          fileType: f.file_type || f.fileType || f.FileType,
          status,
          isActive
        })
        // Only return true for pending/processing, NOT for failed or completed
        return isActive
      })

      const interval = hasActiveProcessingFiles ? 5000 : false
      console.log('useProduct refetchInterval result:', { hasActiveProcessingFiles, interval })

      return interval
    }
  })
}

/**
 * Query: List all products
 */
export function useProducts(status?: string) {
  return useQuery({
    queryKey: ['products', status],
    queryFn: async () => {
      console.log('useProducts: Fetching products...')
      const result = await productApiClient.listProducts(status)
      console.log('useProducts: Result type:', typeof result, 'Is array:', Array.isArray(result))
      console.log('useProducts: Result:', result)
      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Mutation: Request upload URLs
 */
export function useRequestUploadURLs() {
  return useMutation({
    mutationFn: (files: FileUploadURLRequest[]) =>
      productApiClient.requestUploadURLs(files),
  })
}

/**
 * Mutation: Upload file to S3
 */
export function useUploadToS3() {
  return useMutation({
    mutationFn: ({
      uploadURL,
      file,
      onProgress
    }: {
      uploadURL: string
      file: File
      onProgress?: (percent: number) => void
    }) => productApiClient.uploadToS3(uploadURL, file, onProgress),
  })
}

/**
 * Mutation: Create product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productApiClient.createProduct(data),
    onSuccess: (newProduct: any) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // Handle both camelCase and PascalCase property names
      const productId = newProduct.productID || newProduct.ProductID

      // Set the new product in cache
      queryClient.setQueryData(['product', productId], newProduct)
    },
  })
}

/**
 * Combined hook: Upload files and create product
 * Handles the complete flow:
 * 1. Request upload URLs
 * 2. Upload files to S3
 * 3. Create product with staged files
 */
export function useCreateProductWithFiles() {
  const requestUploadURLs = useRequestUploadURLs()
  const uploadToS3 = useUploadToS3()
  const createProduct = useCreateProduct()

  return {
    async createWithFiles(
      productData: Omit<CreateProductRequest, 'stagedFiles'>,
      files: { file: File; fileType: string }[],
      onFileProgress?: (fileName: string, percent: number) => void
    ): Promise<ProductResponse> {
      // Step 1: Request upload URLs
      console.log('useCreateProductWithFiles: Requesting upload URLs for', files.length, 'files')
      const uploadURLsResponse = await requestUploadURLs.mutateAsync(
        files.map(({ file, fileType }) => ({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileType: fileType as any,
        }))
      )

      console.log('useCreateProductWithFiles: Upload URLs response:', uploadURLsResponse)

      // Handle different response structures (camelCase or PascalCase)
      const response: any = uploadURLsResponse
      const uploadURLs = response?.uploadURLs || response?.UploadURLs || response

      if (!uploadURLs || !Array.isArray(uploadURLs)) {
        console.error('Invalid upload URLs response:', uploadURLsResponse)
        throw new Error('Failed to get upload URLs from server')
      }

      // Step 2: Upload all files to S3
      console.log('useCreateProductWithFiles: Uploading files to S3')
      const stagedFiles: StagedFileInfo[] = []

      for (let i = 0; i < files.length; i++) {
        const { file, fileType } = files[i]
        const uploadData: any = uploadURLs[i]

        // Handle both camelCase and PascalCase property names
        const uploadURL = uploadData.uploadURL || uploadData.UploadURL
        const uploadId = uploadData.uploadId || uploadData.UploadID
        const stagingKey = uploadData.stagingKey || uploadData.StagingKey
        const fileName = uploadData.fileName || uploadData.FileName

        await uploadToS3.mutateAsync({
          uploadURL: uploadURL,
          file,
          onProgress: (percent) => {
            onFileProgress?.(file.name, percent)
          }
        })

        stagedFiles.push({
          uploadId: uploadId,
          stagingKey: stagingKey,
          fileName: fileName,
          fileSize: file.size,
          mimeType: file.type,
          fileType: fileType,
        })
      }

      // Step 3: Create product with staged files
      console.log('useCreateProductWithFiles: Creating product with', stagedFiles.length, 'staged files')
      return await createProduct.mutateAsync({
        ...productData,
        stagedFiles,
      })
    },
    isPending: requestUploadURLs.isPending || uploadToS3.isPending || createProduct.isPending,
    error: requestUploadURLs.error || uploadToS3.error || createProduct.error,
  }
}
