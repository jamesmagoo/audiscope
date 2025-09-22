"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Upload, 
  Search, 
  MoreHorizontal, 
  Download,
  Eye,
  Trash2,
  BookOpen
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useDocumentUpload, useKnowledgeBaseConfig } from "@/hooks/use-knowledge-base"

interface Document {
  id: string
  title: string
  type: "pdf" | "doc" | "txt" | "md"
  size: number
  uploadDate: Date
  lastModified: Date
  tags?: string[]
  description?: string
}

// Mock data - replace with actual API integration using existing knowledge-base service
const mockDocuments: Document[] = [
  {
    id: "doc-1",
    title: "EVeNTS Assessment Framework Guide",
    type: "pdf",
    size: 2400000,
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tags: ["framework", "assessment", "guidelines"],
    description: "Comprehensive guide to the EndoVascular Non-Technical Skills assessment methodology"
  },
  {
    id: "doc-2",
    title: "Clinical Communication Protocols",
    type: "doc",
    size: 800000,
    uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tags: ["communication", "protocols", "clinical"],
    description: "Standard communication procedures for medical teams during procedures"
  },
  {
    id: "doc-3",
    title: "Leadership Training Manual",
    type: "pdf",
    size: 3200000,
    uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    tags: ["leadership", "training", "development"],
    description: "Training materials for developing clinical leadership skills"
  },
  {
    id: "doc-4",
    title: "Case Study Templates",
    type: "md",
    size: 150000,
    uploadDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tags: ["templates", "case-studies"],
    description: "Standardized templates for documenting and analyzing clinical cases"
  },
  {
    id: "doc-5",
    title: "Audio Analysis Best Practices",
    type: "txt",
    size: 45000,
    uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    tags: ["audio", "analysis", "best-practices"],
    description: "Guidelines for effective audio recording and analysis in clinical settings"
  }
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  if (diffInDays < 1) {
    return "Today"
  } else if (diffInDays < 2) {
    return "Yesterday"
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

function getFileIcon(type: Document["type"]) {
  switch (type) {
    case "pdf":
      return <FileText className="h-4 w-4 text-red-500" />
    case "doc":
      return <FileText className="h-4 w-4 text-blue-500" />
    case "txt":
      return <FileText className="h-4 w-4 text-gray-500" />
    case "md":
      return <FileText className="h-4 w-4 text-green-500" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function KnowledgeBasePanel() {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // React Query hooks
  const documentUpload = useDocumentUpload()
  const { knowledgeBaseId } = useKnowledgeBaseConfig()

  // Get all unique tags
  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags || [])))

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => doc.tags?.includes(tag))

    return matchesSearch && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id))
  }

  const handleUploadDocument = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.pdf,.doc,.docx,.txt,.md'
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          await documentUpload.mutateAsync({
            file,
            knowledgeBaseId
          })
          console.log('Document uploaded successfully!')
          // Show success message to user
        } catch (error) {
          console.error('Error uploading document:', error)
          // Show error message to user
        }
      }
    }
    fileInput.click()
  }

  return (
    <Card className="h-full rounded-none border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Knowledge Base
        </CardTitle>
        <Button 
          onClick={handleUploadDocument}
          className="w-full justify-start"
          variant="outline"
          disabled={documentUpload.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          {documentUpload.isPending ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardHeader>

      <CardContent className="px-4 pb-0 flex-1">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tag Filters
        {allTags.length > 0 && (
          <>
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Filter by tags</h4>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="mb-4" />
          </>
        )} */}

        {/* Documents List */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate mb-1">
                          {doc.title}
                        </h4>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>Modified {formatDate(doc.lastModified)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedTags.length > 0 ? "No documents found" : "No documents uploaded"}
              </p>
              {!searchQuery && selectedTags.length === 0 && (
                <Button 
                  onClick={handleUploadDocument}
                  variant="outline" 
                  className="mt-4"
                >
                  Upload your first document
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}