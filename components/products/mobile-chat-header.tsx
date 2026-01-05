'use client'

import { FileText, BookOpen, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatFileSize, getFileTypeIcon, getProcessingStatusDisplay } from '@/lib/product-utils'

interface MobileChatHeaderProps {
  productTitle?: string
  files: any[]
}

export function MobileChatHeader({ productTitle, files }: MobileChatHeaderProps) {
  const completedFiles = files.filter(f =>
    (f.processing_status || f.processingStatus || f.ProcessingStatus) === 'completed'
  )

  return (
    <div className="flex items-center justify-between h-14 px-4 border-b bg-background sticky top-0 z-10">
      {/* Left: Product title */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold truncate">
          {productTitle || 'Chat'}
        </h2>
      </div>

      {/* Right: Files & Sources dropdowns */}
      <div className="flex items-center gap-1">
        {/* Files Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs">
              <FileText className="h-4 w-4" />
              Files
              {files.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                  {files.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold">Product Files</p>
              {files.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {completedFiles.length} of {files.length} processed
                </p>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {files.length === 0 ? (
                <div className="p-4 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No files uploaded</p>
                </div>
              ) : (
                <div className="p-2">
                  {files.map((file: any, index: number) => {
                    const fileId = file.id || file.fileID || file.FileID || `file-${index}`
                    const fileName = file.file_name || file.fileName || file.FileName || 'Unknown File'
                    const fileType = file.file_type || file.fileType || file.FileType || 'unknown'
                    const fileSize = file.file_size || file.fileSize || file.FileSize || 0
                    const fileStatus = file.processing_status || file.processingStatus || file.ProcessingStatus || 'unknown'

                    const statusDisplay = getProcessingStatusDisplay(fileStatus)
                    const StatusIcon = statusDisplay.icon
                    const FileIcon = getFileTypeIcon(fileType)
                    const downloadUrl = file.download_url || file.downloadUrl

                    return (
                      <div
                        key={fileId}
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-accent mb-1"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <FileIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{fileName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <StatusIcon className={`h-2.5 w-2.5 ${statusDisplay.color}`} />
                            <span className={`text-[10px] ${statusDisplay.color}`}>
                              {statusDisplay.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              • {formatFileSize(fileSize)}
                            </span>
                          </div>
                        </div>
                        {fileStatus === 'completed' && downloadUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 flex-shrink-0"
                            asChild
                          >
                            <a href={downloadUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sources Dropdown
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs">
              <BookOpen className="h-4 w-4" />
              Sources
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold">Knowledge Sources</p>
            </div>
            <div className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Knowledge base sources will appear here
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
    </div>
  )
}
