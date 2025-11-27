# Add Files to Product API Integration Guide

## Overview

This document describes how to integrate with the **Add Files to Product** API endpoint, which allows adding files to existing products after they've been created.

**API Endpoint**: `POST /api/v1/products/:id/files`

**Base URL**: `https://your-api-domain.com` (or `http://localhost:5002` for local dev)

## Authentication

All requests require a valid JWT Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The JWT must contain:
- `user_id` - User identifier
- `organisation_id` - Organization identifier (optional, defaults to system default)

## File Limits & Constraints

- **Maximum files per product**: 20 total files
- **Maximum files per upload request**: 20 files
- **File size limits**:
  - Documents (PDFs, Word, PowerPoint): 500 MB per file
  - Images & Videos: 500 MB per file
- **Validation**: Request is rejected entirely if adding files would exceed the 20-file limit

## Upload Flow

### Step 1: Request Pre-Signed Upload URLs

First, request pre-signed URLs for uploading files to the staging bucket.

**Endpoint**: `POST /api/v1/products/files/upload-urls`

**Request Body**:
```json
{
  "files": [
    {
      "fileName": "product-manual.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "fileType": "ifu"
    },
    {
      "fileName": "device-photo.jpg",
      "fileSize": 512000,
      "mimeType": "image/jpeg",
      "fileType": "product_image"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "uploadURLs": [
    {
      "uploadId": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "product-manual.pdf",
      "stagingKey": "staging/550e8400-e29b-41d4-a716-446655440000/product-manual.pdf",
      "uploadURL": "https://s3.amazonaws.com/bucket/staging/...?X-Amz-Signature=...",
      "expiresAt": "2025-11-27T12:00:00Z"
    },
    {
      "uploadId": "660e8400-e29b-41d4-a716-446655440001",
      "fileName": "device-photo.jpg",
      "stagingKey": "staging/660e8400-e29b-41d4-a716-446655440001/device-photo.jpg",
      "uploadURL": "https://s3.amazonaws.com/bucket/staging/...?X-Amz-Signature=...",
      "expiresAt": "2025-11-27T12:00:00Z"
    }
  ]
}
```

### Step 2: Upload Files to S3 Staging Bucket

Use the pre-signed URLs to upload files directly to S3 (client-side):

```typescript
async function uploadFileToS3(file: File, uploadURL: string): Promise<void> {
  const response = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}
```

### Step 3: Add Files to Product

After successfully uploading files to S3, notify the API to add them to the product.

**Endpoint**: `POST /api/v1/products/:id/files`

**Request Body**:
```json
{
  "stagedFiles": [
    {
      "uploadId": "550e8400-e29b-41d4-a716-446655440000",
      "stagingKey": "staging/550e8400-e29b-41d4-a716-446655440000/product-manual.pdf",
      "fileName": "product-manual.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "fileType": "ifu"
    },
    {
      "uploadId": "660e8400-e29b-41d4-a716-446655440001",
      "stagingKey": "staging/660e8400-e29b-41d4-a716-446655440001/device-photo.jpg",
      "fileName": "device-photo.jpg",
      "fileSize": 512000,
      "mimeType": "image/jpeg",
      "fileType": "product_image"
    }
  ]
}
```

**Success Response** (200 OK):
```json
{
  "productId": "f8fc439c-32c0-4733-82e3-b4a15fb4766a",
  "files": [
    {
      "fileId": "770e8400-e29b-41d4-a716-446655440002",
      "fileName": "product-manual.pdf",
      "fileType": "ifu",
      "fileSize": 2048576,
      "processingStatus": "pending"
    },
    {
      "fileId": "880e8400-e29b-41d4-a716-446655440003",
      "fileName": "device-photo.jpg",
      "fileType": "product_image",
      "fileSize": 512000,
      "processingStatus": "pending"
    }
  ]
}
```

**Error Responses**:

- **400 Bad Request** - Invalid request body or file limit exceeded
  ```json
  {
    "error": "cannot add 5 files: would exceed maximum of 20 files per product (current: 18)"
  }
  ```

- **401 Unauthorized** - Missing or invalid JWT token
  ```json
  {
    "error": "Invalid token: missing user claim"
  }
  ```

- **403 Forbidden** - Product doesn't belong to user's organization
  ```json
  {
    "error": "Access denied"
  }
  ```

- **404 Not Found** - Product doesn't exist
  ```json
  {
    "error": "Product not found"
  }
  ```

## TypeScript Types

```typescript
// File type enum
type FileType =
  | 'ifu'              // Instructions For Use
  | 'technical_spec'   // Technical Specifications
  | 'clinical_data'    // Clinical Data/Studies
  | 'product_image'    // Product photos
  | 'marketing_video'  // Demo/promotional videos
  | 'brochure'         // Marketing brochures
  | 'other';           // Other supporting documents

// Processing status enum
type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Step 1: Request upload URLs
interface FileUploadRequestItem {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
}

interface RequestUploadURLsRequest {
  files: FileUploadRequestItem[];
}

interface UploadURLResponse {
  uploadId: string;
  fileName: string;
  stagingKey: string;
  uploadURL: string;
  expiresAt: string;
}

interface RequestUploadURLsResponse {
  uploadURLs: UploadURLResponse[];
}

// Step 3: Add files to product
interface StagedFileInfo {
  uploadId: string;
  stagingKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
}

interface AddFilesToProductRequest {
  stagedFiles: StagedFileInfo[];
}

interface ProductFileInfo {
  fileId: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  processingStatus: ProcessingStatus;
}

interface AddFilesToProductResponse {
  productId: string;
  files: ProductFileInfo[];
}
```

## Complete React/TypeScript Example

```typescript
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

interface UseAddFilesToProductResult {
  uploadFiles: (productId: string, files: File[]) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useAddFilesToProduct(): UseAddFilesToProductResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const uploadFiles = async (productId: string, files: File[]): Promise<void> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Request upload URLs
      const uploadURLsRequest: RequestUploadURLsRequest = {
        files: files.map(file => ({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileType: inferFileType(file), // Helper function to determine file type
        })),
      };

      const uploadURLsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/files/upload-urls`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(uploadURLsRequest),
        }
      );

      if (!uploadURLsResponse.ok) {
        throw new Error('Failed to get upload URLs');
      }

      const { uploadURLs } = await uploadURLsResponse.json() as RequestUploadURLsResponse;
      setProgress(20);

      // Step 2: Upload files to S3
      const uploadPromises = files.map((file, index) =>
        uploadFileToS3(file, uploadURLs[index].uploadURL)
      );

      await Promise.all(uploadPromises);
      setProgress(70);

      // Step 3: Notify API to add files to product
      const addFilesRequest: AddFilesToProductRequest = {
        stagedFiles: uploadURLs.map((upload, index) => ({
          uploadId: upload.uploadId,
          stagingKey: upload.stagingKey,
          fileName: upload.fileName,
          fileSize: files[index].size,
          mimeType: files[index].type,
          fileType: inferFileType(files[index]),
        })),
      };

      const addFilesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${productId}/files`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(addFilesRequest),
        }
      );

      if (!addFilesResponse.ok) {
        const errorData = await addFilesResponse.json();
        throw new Error(errorData.error || 'Failed to add files to product');
      }

      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFiles, isUploading, progress, error };
}

// Helper function to upload a single file to S3
async function uploadFileToS3(file: File, uploadURL: string): Promise<void> {
  const response = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}`);
  }
}

// Helper function to infer file type from file metadata
function inferFileType(file: File): FileType {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;

  if (mimeType.startsWith('image/')) return 'product_image';
  if (mimeType.startsWith('video/')) return 'marketing_video';
  if (mimeType === 'application/pdf') {
    // Could be IFU, brochure, or other - you may want to let user choose
    return 'ifu';
  }

  return 'other';
}
```

## Usage Example in Component

```tsx
'use client';

import { useState } from 'react';
import { useAddFilesToProduct } from '@/hooks/useAddFilesToProduct';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface AddFilesFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function AddFilesForm({ productId, onSuccess }: AddFilesFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { uploadFiles, isUploading, progress, error } = useAddFilesToProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) return;

    try {
      await uploadFiles(productId, selectedFiles);
      setSelectedFiles([]);
      onSuccess?.();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Validate file count (max 20 per request)
      if (files.length > 20) {
        alert('You can only upload up to 20 files at a time');
        return;
      }

      setSelectedFiles(files);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="files" className="block text-sm font-medium">
          Select Files (max 20)
        </label>
        <input
          id="files"
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
          className="mt-1"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedFiles.length} file(s) selected
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600">Uploading... {progress}%</p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isUploading || selectedFiles.length === 0}
      >
        {isUploading ? 'Uploading...' : 'Upload Files'}
      </Button>
    </form>
  );
}
```

## File Processing Status

After files are added to a product:

1. **pending** → File metadata saved, copying from staging to main bucket
2. **processing** → For documents (PDFs, Word, PowerPoint), sent to document processing queue
3. **completed** → File successfully processed and ready to use
4. **failed** → Processing failed (check error message in file metadata)

Images and videos are marked as **completed** immediately after copying to the main bucket, as they don't require document processing.

## Best Practices

1. **Check current file count** before allowing users to upload more files
2. **Validate file types** on the client side before uploading
3. **Show upload progress** to users during the multi-step process
4. **Handle errors gracefully** - especially the file limit exceeded error
5. **Poll for processing status** after upload to show when documents are ready
6. **Use optimistic UI updates** - show files immediately with "pending" status

## Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5002
# or for production:
# NEXT_PUBLIC_API_URL=https://api.audiscope.com
```

## Notes

- URLs expire after 15 minutes - ensure files are uploaded promptly
- File processing happens asynchronously - documents may take several minutes to process
- The API will automatically send documents to the processing queue
- Organization ownership is automatically verified from the JWT token
- Archived products cannot have files added to them