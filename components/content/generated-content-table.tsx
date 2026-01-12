'use client'

import { formatDistanceToNow } from 'date-fns'
import { Loader2, FileEdit, Eye, FileQuestion, CreditCard, Presentation } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAllGenerations } from '@/hooks/use-generated-content'
import type { Generation, WorkflowState } from '@/lib/types/generated-content'

interface GeneratedContentTableProps {
  onViewContent?: (generationId: string) => void
}

export function GeneratedContentTable({ onViewContent }: GeneratedContentTableProps) {
  const { data, isLoading, error } = useAllGenerations({ limit: 50 })

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'quiz':
        return <FileQuestion className="h-4 w-4" />
      case 'flashcard':
        return <CreditCard className="h-4 w-4" />
      case 'learning_module':
        return <Presentation className="h-4 w-4" />
      default:
        return <FileEdit className="h-4 w-4" />
    }
  }

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'quiz':
        return 'Quiz'
      case 'flashcard':
        return 'Flashcard'
      case 'learning_module':
        return 'Learning Module'
      default:
        return contentType
    }
  }

  const getGenerationStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      success: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Success' },
      partial: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Partial' },
      failed: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Failed' },
    }
    const config = variants[status] || variants.failed
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (workflowState: WorkflowState) => {
    const variants: Record<WorkflowState, { className: string; label: string }> = {
      draft: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Draft' },
      edited: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Edited' },
      published: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Published' },
    }
    const config = variants[workflowState]
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            AI-generated learning content from product IFU documents
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading content...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            AI-generated learning content from product IFU documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {(error as any)?.message || 'Failed to load content. Please try again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const generations = data?.generations || []

  if (generations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            AI-generated learning content from product IFU documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileEdit className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Click "Generate Content" above to create AI-powered learning materials from product documentation.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Content</CardTitle>
        <CardDescription>
          {data?.total || 0} item{(data?.total || 0) !== 1 ? 's' : ''} generated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Gen Status</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {generations.map((generation: Generation) => (
              <TableRow
                key={generation.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewContent?.(generation.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(generation.content_type)}
                    <span className="text-sm">{getContentTypeLabel(generation.content_type)}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {generation.product_name || 'Unknown Product'}
                </TableCell>
                <TableCell>
                  {generation.status === 'failed' ? (
                    <span className="text-muted-foreground italic">Generation failed</span>
                  ) : (
                    generation.content?.title || 'Untitled'
                  )}
                </TableCell>
                <TableCell className="capitalize">{generation.content?.difficulty || 'N/A'}</TableCell>
                <TableCell>{getGenerationStatusBadge(generation.status)}</TableCell>
                <TableCell>{getStatusBadge(generation.workflow_state)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(generation.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={generation.status === 'failed'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewContent?.(generation.id)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
