'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  ChevronDown,
  Upload,
  FolderOpen,
} from 'lucide-react'
import { getFileDownloadUrl } from '@/lib/product-utils'
import { AddFilesDialog } from './add-files-dialog'

interface ProductFilesSidebarProps {
  files: any[]
  productId: string
  onUploadClick?: () => void
}

// File type icon mapping
const FILE_TYPE_ICONS: Record<string, any> = {
  ifu: FileText,
  product_image: Image,
  marketing_video: Video,
  brochure: FileText,
  technical_spec: FileSpreadsheet,
  clinical_data: FileSpreadsheet,
}

// File type label mapping
const FILE_TYPE_LABELS: Record<string, string> = {
  ifu: 'Instructions for Use',
  product_image: 'Product Image',
  marketing_video: 'Marketing Video',
  brochure: 'Brochure',
  technical_spec: 'Technical Specifications',
  clinical_data: 'Clinical Data',
}

// Processing status display
const getProcessingStatusDisplay = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        icon: CheckCircle2,
        color: 'text-green-600',
        variant: 'default' as const
      }
    case 'processing':
      return {
        label: 'Processing',
        icon: Clock,
        color: 'text-blue-600',
        variant: 'secondary' as const
      }
    case 'pending':
      return {
        label: 'Pending',
        icon: Clock,
        color: 'text-amber-600',
        variant: 'secondary' as const
      }
    case 'failed':
      return {
        label: 'Failed',
        icon: XCircle,
        color: 'text-red-600',
        variant: 'destructive' as const
      }
    default:
      return {
        label: status,
        icon: AlertCircle,
        color: 'text-gray-600',
        variant: 'secondary' as const
      }
  }
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function ProductFilesSidebar({ files, productId, onUploadClick }: ProductFilesSidebarProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const toggleFileExpansion = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  const handleUploadClick = () => {
    setIsDialogOpen(true)
    onUploadClick?.()
  }

  return (
    <div className="flex flex-col h-[calc(100%-0.5rem)] w-64 md:w-72 lg:w-80 flex-shrink-0 border mx-2 rounded-lg bg-background max-w-[320px] overflow-hidden">
      {/* Header */}
      <div className="m-3 bg-background space-y-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Files & Sources</h2>
          {files.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {files.length}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          className="w-full text-xs h-8"
          onClick={handleUploadClick}
        >
          <Upload className="h-3.5 w-3.5 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-2 pr-3">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground">No files uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload files to get started
              </p>
            </div>
          ) : (
            files.map((file: any, index: number) => {
              const fileId = file.id || file.fileID || file.FileID || `file-${index}`
              const fileName = file.file_name || file.fileName || file.FileName || 'Unknown File'
              const fileType = file.file_type || file.fileType || file.FileType || 'unknown'
              const fileSize = file.file_size || file.fileSize || file.FileSize || 0
              const fileStatus = file.processing_status || file.processingStatus || file.ProcessingStatus || 'unknown'
              const downloadUrl = getFileDownloadUrl(file)
              const processingError = file.processing_error || file.processingError

              const statusDisplay = getProcessingStatusDisplay(fileStatus)
              const StatusIcon = statusDisplay.icon
              const FileIcon = FILE_TYPE_ICONS[fileType] || File
              const fileTypeLabel = FILE_TYPE_LABELS[fileType] || fileType
              const isExpanded = expandedFiles.has(fileId)

              return (
                <div key={fileId} className="mb-1.5">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleFileExpansion(fileId)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full rounded-md hover:bg-accent p-2 transition-colors overflow-hidden">
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-medium truncate max-w-full">{fileName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <StatusIcon className={`h-2.5 w-2.5 ${statusDisplay.color}`} />
                              <span className={`text-[10px] ${statusDisplay.color}`}>
                                {statusDisplay.label}
                              </span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="px-2 pb-2">
                      <div className="mt-1.5 space-y-2 border-t pt-2">
                        {/* File Details */}
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] text-muted-foreground">Type</span>
                            <p className="text-xs font-medium truncate">{fileTypeLabel}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground">Size</span>
                            <p className="text-xs font-medium">{formatFileSize(fileSize)}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground">File ID</span>
                            <p className="text-xs font-mono truncate max-w-full">{fileId.slice(0, 16)}...</p>
                          </div>
                        </div>

                        {/* Processing Indicator */}
                        {(fileStatus === 'processing' || fileStatus === 'pending') && (
                          <div>
                            <Progress value={fileStatus === 'processing' ? 50 : 10} className="h-1" />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {fileStatus === 'processing' ? 'Processing...' : 'Waiting...'}
                            </p>
                          </div>
                        )}

                        {/* Processing Error */}
                        {fileStatus === 'failed' && processingError && (
                          <div className="p-1.5 bg-destructive/10 border border-destructive/20 rounded text-[10px] text-destructive">
                            Error: {processingError}
                          </div>
                        )}

                        {/* Download Button */}
                        {fileStatus === 'completed' && downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            asChild
                          >
                            <a href={downloadUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-1.5" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Add Files Dialog */}
      <AddFilesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        productId={productId}
        currentFileCount={files.length}
      />
    </div>
  )
}
