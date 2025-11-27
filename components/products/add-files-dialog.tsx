'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  X,
  FileText,
  Image,
  Video,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useAddFilesToProductFlow, type FileWithProgress } from '@/hooks/use-product-files'
import type { FileType } from '@/lib/product-files.service'

// ============================================================================
// Constants
// ============================================================================

const MAX_FILES_PER_PRODUCT = 20
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

const FILE_TYPE_OPTIONS = [
  { value: 'ifu' as FileType, label: 'IFU (Instructions For Use)', icon: FileText },
  { value: 'product_image' as FileType, label: 'Product Image', icon: Image },
  { value: 'marketing_video' as FileType, label: 'Marketing Video', icon: Video },
  { value: 'brochure' as FileType, label: 'Brochure', icon: FileText },
  { value: 'technical_spec' as FileType, label: 'Technical Specification', icon: FileText },
  { value: 'clinical_data' as FileType, label: 'Clinical Data', icon: FileText },
  { value: 'other' as FileType, label: 'Other', icon: FileText },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Infer default file type from file metadata
 */
function getDefaultFileType(file: File): FileType {
  const mimeType = file.type.toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (mimeType.startsWith('image/')) return 'product_image'
  if (mimeType.startsWith('video/')) return 'marketing_video'
  if (mimeType === 'application/pdf') return 'ifu'
  if (extension === 'mp4' || extension === 'mov' || extension === 'avi') return 'marketing_video'

  return 'other'
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get step description for current upload state
 */
function getStepDescription(step: string): string {
  switch (step) {
    case 'requesting-urls':
      return 'Step 1 of 3: Requesting upload URLs...'
    case 'uploading':
      return 'Step 2 of 3: Uploading files to storage...'
    case 'finalizing':
      return 'Step 3 of 3: Finalizing and processing files...'
    case 'completed':
      return 'Upload completed successfully!'
    case 'error':
      return 'Upload failed'
    default:
      return ''
  }
}

// ============================================================================
// Component Interfaces
// ============================================================================

interface SelectedFile {
  file: File
  fileType: FileType
  id: string
}

interface AddFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  currentFileCount: number
  onSuccess?: () => void
}

// ============================================================================
// Main Component
// ============================================================================

export function AddFilesDialog({
  open,
  onOpenChange,
  productId,
  currentFileCount,
  onSuccess,
}: AddFilesDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { uploadFiles, reset, state, isPending, isSuccess, isError, error } =
    useAddFilesToProductFlow()

  // Calculate available slots
  const availableSlots = MAX_FILES_PER_PRODUCT - currentFileCount
  const canAddFiles = selectedFiles.length > 0 && selectedFiles.length <= availableSlots

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFiles([])
      setValidationError(null)
      reset()
    }
  }, [open, reset])

  // Auto-close dialog after successful upload
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onSuccess?.()
        onOpenChange(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onSuccess, onOpenChange])

  // ============================================================================
  // File Selection Handlers
  // ============================================================================

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; error: string | null } => {
      // Check file count limit
      if (currentFileCount + files.length > MAX_FILES_PER_PRODUCT) {
        return {
          valid: [],
          error: `Cannot add ${files.length} file(s). Would exceed maximum of ${MAX_FILES_PER_PRODUCT} files per product (current: ${currentFileCount})`,
        }
      }

      // Check file sizes
      const oversizedFiles = files.filter((f) => f.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        return {
          valid: [],
          error: `File(s) exceed maximum size of ${formatFileSize(MAX_FILE_SIZE)}: ${oversizedFiles
            .map((f) => f.name)
            .join(', ')}`,
        }
      }

      return { valid: files, error: null }
    },
    [currentFileCount]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      const { valid, error } = validateFiles(droppedFiles)

      if (error) {
        setValidationError(error)
        return
      }

      const newFiles: SelectedFile[] = valid.map((file) => ({
        file,
        fileType: getDefaultFileType(file),
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }))

      setSelectedFiles((prev) => [...prev, ...newFiles])
      setValidationError(null)
    },
    [validateFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return

      const selectedFilesList = Array.from(e.target.files)
      const { valid, error } = validateFiles(selectedFilesList)

      if (error) {
        setValidationError(error)
        return
      }

      const newFiles: SelectedFile[] = valid.map((file) => ({
        file,
        fileType: getDefaultFileType(file),
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }))

      setSelectedFiles((prev) => [...prev, ...newFiles])
      setValidationError(null)

      // Reset input
      e.target.value = ''
    },
    [validateFiles]
  )

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id))
    setValidationError(null)
  }, [])

  const updateFileType = useCallback((id: string, newFileType: FileType) => {
    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, fileType: newFileType } : f))
    )
  }, [])

  // ============================================================================
  // Upload Handler
  // ============================================================================

  const handleUpload = useCallback(async () => {
    if (!canAddFiles) return

    try {
      await uploadFiles(
        productId,
        selectedFiles.map(({ file, fileType }) => ({ file, fileType }))
      )
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }, [canAddFiles, uploadFiles, productId, selectedFiles])

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getFileIcon = (fileType: FileType) => {
    const option = FILE_TYPE_OPTIONS.find((opt) => opt.value === fileType)
    return option?.icon || FileText
  }

  const getFileProgress = (file: SelectedFile): FileWithProgress | undefined => {
    return state.filesWithProgress.find(
      (f) => f.file.name === file.file.name && f.file.size === file.file.size
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Files to Product</DialogTitle>
          <DialogDescription>
            Upload additional files to this product. Maximum {MAX_FILES_PER_PRODUCT} files per
            product.
          </DialogDescription>
        </DialogHeader>

        {/* File Limit Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Files Used</span>
            <span className="font-medium">
              {currentFileCount + selectedFiles.length} / {MAX_FILES_PER_PRODUCT}
            </span>
          </div>
          <Progress
            value={((currentFileCount + selectedFiles.length) / MAX_FILES_PER_PRODUCT) * 100}
            className="h-2"
          />
          {availableSlots <= 5 && availableSlots > 0 && (
            <p className="text-xs text-amber-600">
              Only {availableSlots} file slot{availableSlots !== 1 ? 's' : ''} remaining
            </p>
          )}
          {availableSlots === 0 && (
            <p className="text-xs text-destructive">File limit reached</p>
          )}
        </div>

        {/* Upload Progress - Show when uploading */}
        {isPending && (
          <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">{getStepDescription(state.step)}</span>
            </div>
            <Progress value={state.overallProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{state.overallProgress}% complete</p>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
            <p className="text-sm text-green-900 dark:text-green-100">
              Files uploaded successfully! Processing will complete shortly.
            </p>
          </div>
        )}

        {/* Error Message */}
        {(isError || validationError) && (
          <div className="flex items-start gap-2 p-3 border rounded-lg bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-destructive">
              <p className="font-medium">Upload Failed</p>
              <p className="text-xs mt-1">{validationError || error || 'An error occurred'}</p>
            </div>
          </div>
        )}

        {/* File Selection Area */}
        {!isPending && !isSuccess && (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${availableSlots === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Drop files here or click to browse</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Maximum {formatFileSize(MAX_FILE_SIZE)} per file
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={availableSlots === 0}
              >
                Select Files
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={availableSlots === 0}
              />
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Selected Files ({selectedFiles.length})
                </h4>
                <ScrollArea className="max-h-[300px] border rounded-lg">
                  <div className="p-2 space-y-2">
                    {selectedFiles.map((selectedFile) => {
                      const FileIcon = getFileIcon(selectedFile.fileType)
                      const fileProgress = getFileProgress(selectedFile)
                      const showProgress = fileProgress && fileProgress.status !== 'pending'

                      return (
                        <div
                          key={selectedFile.id}
                          className="flex items-start gap-3 p-3 border rounded-lg bg-background"
                        >
                          {/* File Icon */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-primary" />
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <p className="text-sm font-medium truncate">
                                {selectedFile.file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.file.size)}
                              </p>
                            </div>

                            {/* File Type Select */}
                            <Select
                              value={selectedFile.fileType}
                              onValueChange={(value) =>
                                updateFileType(selectedFile.id, value as FileType)
                              }
                              disabled={isPending}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FILE_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Progress Bar */}
                            {showProgress && fileProgress && (
                              <div className="space-y-1">
                                <Progress value={fileProgress.progress} className="h-1.5" />
                                <p className="text-xs text-muted-foreground">
                                  {fileProgress.progress}%{' '}
                                  {fileProgress.status === 'uploading' ? 'uploading...' : ''}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeFile(selectedFile.id)}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {isSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!isSuccess && (
            <Button onClick={handleUpload} disabled={!canAddFiles || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
