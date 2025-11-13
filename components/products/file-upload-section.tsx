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

    // Handle single image constraint: remove existing product_image if new image is added
    const hasNewImage = newFiles.some(f => f.fileType === 'product_image')
    const filteredFiles = hasNewImage
      ? files.filter(f => f.fileType !== 'product_image')
      : files

    onFilesChange([...filteredFiles, ...newFiles])
  }, [files, onFilesChange])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    const newFiles: FileWithMetadata[] = selectedFiles.map(file => ({
      file,
      fileType: getDefaultFileType(file),
    }))

    // Handle single image constraint: remove existing product_image if new image is added
    const hasNewImage = newFiles.some(f => f.fileType === 'product_image')
    const filteredFiles = hasNewImage
      ? files.filter(f => f.fileType !== 'product_image')
      : files

    onFilesChange([...filteredFiles, ...newFiles])
  }, [files, onFilesChange])

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }, [files, onFilesChange])

  const updateFileType = useCallback((index: number, newFileType: string) => {
    const updated = [...files]
    updated[index].fileType = newFileType

    // Handle single image constraint: if changing to product_image, remove any OTHER product_image
    if (newFileType === 'product_image') {
      const filtered = updated.filter((f, i) => i === index || f.fileType !== 'product_image')
      onFilesChange(filtered)
    } else {
      onFilesChange(updated)
    }
  }, [files, onFilesChange])

  // Check if there's already a product_image
  const hasProductImage = files.some(f => f.fileType === 'product_image')

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
                        {FILE_TYPE_OPTIONS.map(option => {
                          // Disable product_image option if one already exists and this isn't it
                          const isProductImageDisabled =
                            option.value === 'product_image' &&
                            hasProductImage &&
                            fileItem.fileType !== 'product_image'

                          return (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={isProductImageDisabled}
                            >
                              {option.label}
                              {isProductImageDisabled && ' (Only one allowed)'}
                            </SelectItem>
                          )
                        })}
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
