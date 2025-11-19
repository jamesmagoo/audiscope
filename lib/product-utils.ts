/**
 * Product utility functions
 */

export interface ProductFile {
  id?: string
  fileID?: string
  FileID?: string
  file_name?: string
  fileName?: string
  FileName?: string
  file_type?: string
  fileType?: string
  FileType?: string
  file_size?: number
  fileSize?: number
  FileSize?: number
  processing_status?: string
  processing_error?: string
  processingStatus?: string
  ProcessingStatus?: string
  download_url?: string
  downloadUrl?: string
  DownloadUrl?: string
  mime_type?: string
  mimeType?: string
  MimeType?: string
}

/**
 * Extract the primary product image from a product's files array
 * Handles multiple naming conventions (snake_case, camelCase, PascalCase)
 * Returns product_image regardless of processing status (for immediate display)
 */
export function getProductImage(files?: ProductFile[]): ProductFile | null {
  if (!files || files.length === 0) {
    return null
  }

  // Find first product_image (regardless of status)
  const productImage = files.find((file) => {
    const fileType = file.file_type || file.fileType || file.FileType
    return fileType === 'product_image'
  })

  return productImage || null
}

/**
 * Get the download URL for a product file
 * Handles multiple naming conventions
 */
export function getFileDownloadUrl(file: ProductFile): string | null {
  return file.download_url || file.downloadUrl || file.DownloadUrl || null
}

/**
 * Get the file name from a product file
 * Handles multiple naming conventions
 */
export function getFileName(file: ProductFile): string {
  return file.file_name || file.fileName || file.FileName || 'Unknown File'
}

/**
 * Get the file type from a product file
 * Handles multiple naming conventions
 */
export function getFileType(file: ProductFile): string {
  return file.file_type || file.fileType || file.FileType || 'unknown'
}

/**
 * Get the processing status from a product file
 * Handles multiple naming conventions
 */
export function getFileStatus(file: ProductFile): string {
  return file.processing_status || file.processingStatus || file.ProcessingStatus || 'unknown'
}

/**
 * Check if a product has a completed image
 */
export function hasProductImage(files?: ProductFile[]): boolean {
  return getProductImage(files) !== null
}
