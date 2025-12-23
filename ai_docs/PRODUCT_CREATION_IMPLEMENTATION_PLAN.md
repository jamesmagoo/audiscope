# Product Creation Feature - Implementation Plan

## Overview

This document outlines the implementation plan for adding product creation and file upload functionality to the Audiscope UI, integrating with the core-api backend.

## Backend API Integration

### Core-API Endpoints (Already Implemented)

The backend provides these endpoints:

1. **POST** `/api/v1/products/files/upload-urls` - Request pre-signed S3 upload URLs
2. **POST** `/api/v1/products` - Create product with staged files
3. **GET** `/api/v1/products/:id` - Get product details with file status
4. **GET** `/api/v1/products` - List products

### File Upload Flow (Staging Bucket Pattern)

```
1. Request upload URLs → Get pre-signed S3 URLs
2. Upload files directly to S3 staging bucket
3. Create product with staged file references
4. Backend copies files asynchronously (staging → main bucket)
5. Documents (PDF/Word/PowerPoint) queued to SQS for processing
6. Images/videos marked as completed immediately
```

---

## Files to Create/Modify

### New Files

```
lib/
└── product.service.ts                # Product API service (NEW)

hooks/
└── use-products.ts                    # React Query hooks (NEW)

components/products/
├── product-form.tsx                   # Main creation form (NEW)
├── file-upload-section.tsx            # File upload component (NEW)
└── product-list.tsx                   # Product listing (NEW - Future)

app/dashboard/products/
├── page.tsx                           # Products home page (NEW)
└── create/
    └── page.tsx                       # Create product page (NEW)
```

### Files to Modify

```
app/dashboard/layout.tsx               # Add "Products" to sidebar navigation
.env.local                             # Add core-api URL (already has it)
```

---

## Implementation Steps

### Step 1: Create Core API Service

**File:** `lib/core-api.service.ts`

**Purpose:** Handle all communication with core-api backend

```typescript
import { getAuthHeaders, getCurrentUserId } from './api-utils'

// Environment-based API URL
const CORE_API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5002/api'
  : process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:5002/api'

const ENDPOINT = `${CORE_API_BASE}/v1/products`

/**
 * TypeScript Interfaces
 * Match backend Go structs
 */

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

// Product response
export interface ProductResponse {
  productID: string
  organizationID: string
  name: string
  manufacturer: string
  modelNumber: string
  category: string
  status: 'draft' | 'active' | 'archived'
  description: string
  createdAt: string
  files?: ProductFileInfo[]
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
  const headers = await getAuthHeaders()

  const response = await fetch(`${ENDPOINT}/files/upload-urls`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to request upload URLs: ${error}`)
  }

  return await response.json()
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
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'))
    })

    xhr.open('PUT', uploadURL)
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
  const headers = await getAuthHeaders()

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create product: ${error}`)
  }

  return await response.json()
}

/**
 * Get product by ID (with file status)
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`)
  }

  return await response.json()
}

/**
 * List all products
 */
export async function listProducts(): Promise<ProductResponse[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to list products: ${response.status}`)
  }

  return await response.json()
}

/**
 * Export client object
 */
export const coreApiClient = {
  requestUploadURLs,
  uploadToS3,
  createProduct,
  getProduct,
  listProducts,
}
```

---

### Step 2: Create React Query Hooks

**File:** `hooks/use-products.ts`

**Purpose:** React Query hooks for data fetching and mutations

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  coreApiClient,
  type CreateProductRequest,
  type ProductResponse,
  type FileUploadURLRequest,
  type FileUploadURLResponse,
  type StagedFileInfo
} from '@/lib/core-api.service'

/**
 * Query: Get product by ID
 */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => id ? coreApiClient.getProduct(id) : null,
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: (data) => {
      // Poll every 5 seconds if files are still processing
      const hasProcessingFiles = data?.files?.some(
        f => f.processingStatus === 'pending' || f.processingStatus === 'processing'
      )
      return hasProcessingFiles ? 5000 : false
    }
  })
}

/**
 * Query: List all products
 */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => coreApiClient.listProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Mutation: Request upload URLs
 */
export function useRequestUploadURLs() {
  return useMutation({
    mutationFn: (files: FileUploadURLRequest[]) =>
      coreApiClient.requestUploadURLs(files),
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
    }) => coreApiClient.uploadToS3(uploadURL, file, onProgress),
  })
}

/**
 * Mutation: Create product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) => coreApiClient.createProduct(data),
    onSuccess: (newProduct) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // Set the new product in cache
      queryClient.setQueryData(['product', newProduct.productID], newProduct)
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
      const uploadURLsResponse = await requestUploadURLs.mutateAsync(
        files.map(({ file, fileType }) => ({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileType: fileType as any,
        }))
      )

      // Step 2: Upload all files to S3
      const stagedFiles: StagedFileInfo[] = []

      for (let i = 0; i < files.length; i++) {
        const { file } = files[i]
        const uploadData = uploadURLsResponse.uploadURLs[i]

        await uploadToS3.mutateAsync({
          uploadURL: uploadData.uploadURL,
          file,
          onProgress: (percent) => {
            onFileProgress?.(file.name, percent)
          }
        })

        stagedFiles.push({
          uploadId: uploadData.uploadId,
          stagingKey: uploadData.stagingKey,
          fileName: uploadData.fileName,
          fileSize: file.size,
          mimeType: file.type,
          fileType: fileType as any,
        })
      }

      // Step 3: Create product with staged files
      return await createProduct.mutateAsync({
        ...productData,
        stagedFiles,
      })
    },
    isPending: requestUploadURLs.isPending || uploadToS3.isPending || createProduct.isPending,
    error: requestUploadURLs.error || uploadToS3.error || createProduct.error,
  }
}
```

---

### Step 3: Create File Upload Section Component

**File:** `components/products/file-upload-section.tsx`

**Purpose:** Reusable file upload component with drag-and-drop

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText, Image, Video, File } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface FileWithMetadata {
  file: File
  fileType: string
  uploadProgress?: number
}

interface FileUploadSectionProps {
  files: FileWithMetadata[]
  onFilesChange: (files: FileWithMetadata[]) => void
  isUploading?: boolean
}

const FILE_TYPE_OPTIONS = [
  { value: 'ifu', label: 'IFU (Instructions For Use)', icon: FileText },
  { value: 'product_image', label: 'Product Image', icon: Image },
  { value: 'marketing_video', label: 'Marketing Video', icon: Video },
  { value: 'brochure', label: 'Brochure', icon: FileText },
  { value: 'technical_spec', label: 'Technical Specification', icon: FileText },
  { value: 'clinical_data', label: 'Clinical Data', icon: FileText },
]

const MAX_FILE_SIZE_DOCS = 50 * 1024 * 1024 // 50MB
const MAX_FILE_SIZE_MEDIA = 500 * 1024 * 1024 // 500MB

export function FileUploadSection({
  files,
  onFilesChange,
  isUploading = false,
}: FileUploadSectionProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles: FileWithMetadata[] = droppedFiles.map(file => ({
      file,
      fileType: getDefaultFileType(file),
    }))

    onFilesChange([...files, ...newFiles])
  }, [files, onFilesChange])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    const newFiles: FileWithMetadata[] = selectedFiles.map(file => ({
      file,
      fileType: getDefaultFileType(file),
    }))

    onFilesChange([...files, ...newFiles])
  }, [files, onFilesChange])

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }, [files, onFilesChange])

  const updateFileType = useCallback((index: number, fileType: string) => {
    const updated = [...files]
    updated[index].fileType = fileType
    onFilesChange(updated)
  }, [files, onFilesChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Files</CardTitle>
        <CardDescription>
          Upload IFU documents, images, videos, and other files for this product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to browse
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          >
            Browse Files
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Max size: 50MB for documents, 500MB for videos
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((fileItem, index) => {
              const Icon = getFileIcon(fileItem.file.type)
              const sizeInMB = (fileItem.file.size / 1024 / 1024).toFixed(2)
              const isProcessing = fileItem.uploadProgress !== undefined && fileItem.uploadProgress < 100

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {sizeInMB} MB
                      </Badge>
                    </div>

                    <Select
                      value={fileItem.fileType}
                      onValueChange={(value) => updateFileType(index, value)}
                      disabled={isUploading}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILE_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isProcessing && (
                      <Progress value={fileItem.uploadProgress} className="h-2" />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions
function getDefaultFileType(file: File): string {
  if (file.type.startsWith('image/')) return 'product_image'
  if (file.type.startsWith('video/')) return 'marketing_video'
  if (file.type === 'application/pdf') return 'ifu'
  return 'technical_spec'
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Video
  if (mimeType === 'application/pdf') return FileText
  return File
}
```

---

### Step 4: Create Product Form Component

**File:** `components/products/product-form.tsx`

**Purpose:** Main product creation form

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useCreateProductWithFiles } from '@/hooks/use-products'
import { FileUploadSection, type FileWithMetadata } from './file-upload-section'

// Zod schema
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model_number: z.string().min(1, 'Model number is required'),
  category: z.enum(['cardiovascular', 'orthopedic', 'neurology', 'surgical', 'diagnostic', 'other']),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ProductForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { createWithFiles, isPending } = useCreateProductWithFiles()

  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({})

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      manufacturer: '',
      model_number: '',
      category: 'diagnostic',
      description: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const product = await createWithFiles(
        data,
        files.map(f => ({ file: f.file, fileType: f.fileType })),
        (fileName, percent) => {
          setFileProgress(prev => ({ ...prev, [fileName]: percent }))

          // Update file in list with progress
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.file.name === fileName
                ? { ...f, uploadProgress: percent }
                : f
            )
          )
        }
      )

      toast({
        title: 'Product Created Successfully!',
        description: `${product.name} has been created. Files are being processed.`,
      })

      // Navigate to product detail page
      router.push(`/dashboard/products/${product.productID}`)
    } catch (error) {
      console.error('Failed to create product:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Enter the basic information for the medical device product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label>Product Name*</Label>
                  <FormControl>
                    <Input
                      placeholder="e.g., UltraSound Pro 3000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <Label>Manufacturer*</Label>
                  <FormControl>
                    <Input
                      placeholder="e.g., Siemens Healthineers"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model_number"
              render={({ field }) => (
                <FormItem>
                  <Label>Model Number*</Label>
                  <FormControl>
                    <Input
                      placeholder="e.g., USP-3000-2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Label>Category*</Label>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                        <SelectItem value="orthopedic">Orthopedic</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="surgical">Surgical</SelectItem>
                        <SelectItem value="diagnostic">Diagnostic</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label>Description</Label>
                  <FormControl>
                    <Textarea
                      placeholder="Product description, key features, and clinical applications..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Provide detailed information about the product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FileUploadSection
          files={files}
          onFilesChange={setFiles}
          isUploading={isPending}
        />

        <Card>
          <CardFooter className="pt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              size="lg"
            >
              {isPending ? 'Creating Product...' : 'Create Product'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
```

---

### Step 5: Create Product Creation Page

**File:** `app/dashboard/products/create/page.tsx`

```typescript
'use client'

import { ProductForm } from '@/components/products/product-form'

export default function CreateProductPage() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
        <p className="text-muted-foreground mt-2">
          Add a new medical device to your product catalog
        </p>
      </div>

      <ProductForm />
    </div>
  )
}
```

---

### Step 6: Create Products Home Page (List View - Future)

**File:** `app/dashboard/products/page.tsx`

```typescript
'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your medical device product catalog
          </p>
        </div>
        <Link href="/dashboard/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        {/* TODO: Add ProductList component here */}
        <p className="text-muted-foreground">Product list coming soon...</p>
      </div>
    </div>
  )
}
```

---

### Step 7: Update Dashboard Navigation

**File:** `app/dashboard/layout.tsx`

Add "Products" to the sidebar navigation:

```typescript
// Find the nav items array and add:
{
  title: "Products",
  url: "/dashboard/products",
  icon: Package, // Import from lucide-react
}
```

---

## Environment Variables

Ensure `.env.local` has:

```bash
# Already exists - core-api runs on localhost:5002
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:5002
```

---

## Testing Checklist

### Manual Testing Steps

1. **Request Upload URLs:**
   - Fill out product form
   - Add files via drag-and-drop or browse
   - Verify file type can be changed

2. **Upload to S3:**
   - Submit form
   - Watch upload progress bars
   - Verify files upload to staging bucket

3. **Create Product:**
   - Verify product created successfully
   - Check redirect to product detail page (future)
   - Verify toast notification

4. **File Processing:**
   - Refresh product to see file status
   - PDF should show "processing" status (queued to SQS)
   - Images should show "completed" immediately
   - Check files copied from staging → main bucket

### Backend Verification

```bash
# Check staging bucket
docker exec coreapi-localstack awslocal s3 ls s3://core-api-product-staging-local/

# Check main bucket
docker exec coreapi-localstack awslocal s3 ls s3://core-api-product-files-local/

# Check SQS queue
docker exec coreapi-localstack awslocal sqs receive-message \
  --queue-url http://localhost:4566/000000000000/document-processing
```

---

## Future Enhancements

1. **Product Detail Page** - View/edit individual product
2. **Product List Component** - Paginated, filterable list
3. **File Management** - Delete files, re-upload, download
4. **Status Indicators** - Real-time file processing status
5. **Bulk Upload** - Upload multiple products via CSV
6. **Product Search** - Search by name, category, manufacturer
7. **File Previews** - Preview images, PDFs in-app

---

## Notes

- All API calls use JWT authentication via `getAuthHeaders()`
- File uploads use presigned URLs (no file data through API server)
- React Query handles caching, refetching, and optimistic updates
- Forms use React Hook Form + Zod for validation
- UI components from shadcn/ui library
- TypeScript types match backend Go structs
- Error handling with toast notifications

---

## Implementation Order

1. ✅ Create `core-api.service.ts` (API layer)
2. ✅ Create `use-products.ts` (React Query hooks)
3. ✅ Create `file-upload-section.tsx` (File upload UI)
4. ✅ Create `product-form.tsx` (Main form)
5. ✅ Create `create/page.tsx` (Page wrapper)
6. ✅ Create `page.tsx` (Products home)
7. ✅ Update `layout.tsx` (Add to sidebar)
8. 🔄 Test end-to-end flow
9. 🔄 Add product detail page (future)
10. 🔄 Add product list component (future)
