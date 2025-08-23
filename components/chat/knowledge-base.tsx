"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UploadIcon, SearchIcon, FileTextIcon, DownloadIcon, TrashIcon } from "lucide-react"
import type { Document } from "./types"

interface KnowledgeBaseProps {
  documents: Document[]
  onFileUpload: (files: FileList) => void
  onDeleteDocument: (docId: string) => void
}

export function KnowledgeBase({ documents, onFileUpload, onDeleteDocument }: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    onFileUpload(files)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <div className="px-4 pb-4 border-b border-border space-y-3">
        <Button onClick={() => fileInputRef.current?.click()} className="w-full justify-start gap-2" variant="outline">
          <UploadIcon className="h-4 w-4" />
          Upload Documents
        </Button>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-2">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? "s" : ""} in knowledge base
            </p>
          </div>

          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="p-3 rounded-lg border border-border mb-2 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <FileTextIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{document.name}</p>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">Synced</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(document.size)} • {document.uploadDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <DownloadIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteDocument(document.id)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredDocuments.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No documents found</p>
            </div>
          )}

          {documents.length === 0 && (
            <div className="text-center py-8">
              <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload files to build your knowledge base</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
