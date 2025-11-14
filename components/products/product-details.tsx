'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { useProduct } from '@/hooks/use-products'
import { useProductChat } from '@/hooks/use-product-chat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Package,
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  Download,
  Info,
  FolderOpen,
  MoreHorizontal
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ProductChatTab } from './product-chat-tab'
import { getProductImage, getFileDownloadUrl } from '@/lib/product-utils'

interface ProductDetailsProps {
  id: string
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
        bgColor: 'bg-green-100',
        variant: 'default' as const
      }
    case 'processing':
      return {
        label: 'Processing',
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        variant: 'secondary' as const
      }
    case 'pending':
      return {
        label: 'Pending',
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        variant: 'secondary' as const
      }
    case 'failed':
      return {
        label: 'Failed',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        variant: 'destructive' as const
      }
    default:
      return {
        label: status,
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
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

export function ProductDetails({ id }: ProductDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null)
  const { data: product, isLoading, error } = useProduct(id)
  const { sessions, totalCount: sessionCount } = useProductChat(id)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading product details...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load product details'}
        </AlertDescription>
      </Alert>
    )
  }

  // Handle multiple naming conventions: id, productID, ProductID, etc.
  const productId = (product as any).id || product.productID || (product as any).ProductID || id
  const name = product.name || (product as any).Name || 'Unnamed Product'
  const manufacturer = product.manufacturer || (product as any).Manufacturer || 'Unknown'
  const modelNumber = (product as any).model_number || product.modelNumber || (product as any).ModelNumber || 'N/A'
  const category = product.category || (product as any).Category || 'other'
  const description = product.description || (product as any).Description || ''
  const status = product.status || (product as any).Status || 'draft'
  const createdAt = (product as any).created_at || product.createdAt || (product as any).CreatedAt
  const files = product.files || (product as any).Files || []

  console.log('ProductDetails: Product data:', product)
  console.log('ProductDetails: Using product ID:', productId, 'for API calls')

  // Extract product image
  const productImage = getProductImage(files)
  const imageUrl = productImage ? getFileDownloadUrl(productImage) : null
  const imageStatus = productImage
    ? (productImage.processing_status || productImage.processingStatus || productImage.ProcessingStatus || 'unknown')
    : null
  const isImageProcessing = imageStatus === 'pending' || imageStatus === 'processing'
  const isImageFailed = imageStatus === 'failed'
  const imageError = productImage
    ? (productImage.processing_error || productImage.processingError || productImage.ProcessingError)
    : null

  console.log('ProductDetails - Image Debug:', {
    hasProductImage: !!productImage,
    productImage,
    imageUrl,
    imageStatus,
    isImageProcessing,
    isImageFailed,
    imageError,
    allFiles: files
  })

  // Calculate file processing progress
  const totalFiles = files.length
  const completedFiles = files.filter((f: any) =>
    (f.processing_status || f.processingStatus || f.ProcessingStatus) === 'completed'
  ).length
  const processingProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0
  const hasProcessingFiles = files.some((f: any) => {
    const fileStatus = f.processing_status || f.processingStatus || f.ProcessingStatus
    return fileStatus === 'pending' || fileStatus === 'processing'
  })

  return (
    <div className="flex flex-col h-full min-h-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
        <TabsList className="w-full justify-start flex-shrink-0">
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="files">
            <FolderOpen className="h-4 w-4 mr-2" />
            Files
            {totalFiles > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalFiles}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
            {sessionCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {sessionCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="additional">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Additional Info
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4">
          {/* Product Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0 w-32 h-32 rounded-lg border overflow-hidden bg-muted/20 flex items-center justify-center relative">
                  {imageUrl && !isImageProcessing && !isImageFailed ? (
                    <NextImage
                      src={imageUrl}
                      alt={name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : isImageProcessing ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Processing...</span>
                    </div>
                  ) : isImageFailed ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-2" title={imageError || 'Upload failed'}>
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <span className="text-xs text-destructive text-center">Upload Failed</span>
                    </div>
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground/40" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{name}</CardTitle>
                    <CardDescription className="text-base">
                      {manufacturer} • Model: {modelNumber}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="capitalize">
                      {category}
                    </Badge>
                    <Badge
                      variant={status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {description && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">Product ID</span>
                  <p className="text-sm font-medium font-mono">{productId}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Created</span>
                  <p className="text-sm font-medium">
                    {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Processing Status Card */}
          {totalFiles > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>File Processing Status</CardTitle>
                <CardDescription>
                  {completedFiles} of {totalFiles} files processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>

                {hasProcessingFiles && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Files are still being processed. This page will auto-refresh.
                    </AlertDescription>
                  </Alert>
                )}

                {/* File Status Summary */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {files.map((file: any, index: number) => {
                    const fileId = file.id || file.fileID || file.FileID || `file-${index}`
                    const fileName = file.file_name || file.fileName || file.FileName || 'Unknown File'
                    const fileType = file.file_type || file.fileType || file.FileType || 'unknown'
                    const fileStatus = file.processing_status || file.processingStatus || file.ProcessingStatus || 'unknown'
                    const statusDisplay = getProcessingStatusDisplay(fileStatus)
                    const Icon = statusDisplay.icon

                    return (
                      <div
                        key={fileId}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${statusDisplay.bgColor}/20`}
                      >
                        <Icon className={`h-4 w-4 ${statusDisplay.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileName}</p>
                          <p className={`text-xs ${statusDisplay.color}`}>
                            {statusDisplay.label}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {totalFiles === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No files uploaded</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload product files to get started
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 overflow-y-auto space-y-4">
          {totalFiles > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Product Files</CardTitle>
                <CardDescription>
                  Detailed information about uploaded files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file: any, index: number) => {
                    const fileId = file.id || file.fileID || file.FileID || `file-${index}`
                    const fileName = file.file_name || file.fileName || file.FileName || 'Unknown File'
                    const fileType = file.file_type || file.fileType || file.FileType || 'unknown'
                    const fileSize = file.file_size || file.fileSize || file.FileSize || 0
                    const fileStatus = file.processing_status || file.processingStatus || file.ProcessingStatus || 'unknown'
                    const downloadUrl = file.download_url || file.downloadUrl
                    const processingError = file.processing_error || file.processingError

                    const statusDisplay = getProcessingStatusDisplay(fileStatus)
                    const StatusIcon = statusDisplay.icon
                    const FileIcon = FILE_TYPE_ICONS[fileType] || File
                    const fileTypeLabel = FILE_TYPE_LABELS[fileType] || fileType

                    return (
                      <Card key={fileId} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* File Icon */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileIcon className="h-6 w-6 text-primary" />
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold truncate">{fileName}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {fileTypeLabel}
                                  </p>
                                </div>
                                <Badge variant={statusDisplay.variant} className="flex-shrink-0">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusDisplay.label}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>{formatFileSize(fileSize)}</span>
                                <span>•</span>
                                <span className="font-mono">{fileId.slice(0, 8)}...</span>
                              </div>

                              {/* Processing Indicator */}
                              {(fileStatus === 'processing' || fileStatus === 'pending') && (
                                <div className="mt-3">
                                  <Progress value={fileStatus === 'processing' ? 50 : 10} className="h-1" />
                                </div>
                              )}

                              {/* Processing Error */}
                              {fileStatus === 'failed' && processingError && (
                                <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                                  Error: {processingError}
                                </div>
                              )}

                              {/* Download Button */}
                              {fileStatus === 'completed' && downloadUrl && (
                                <div className="mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={downloadUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No files uploaded</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload IFU documents, images, videos, and other files
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 overflow-hidden p-0 min-h-0">
          <ProductChatTab
            productId={productId}
            productName={name}
            activeSessionId={activeChatSessionId}
            onSessionIdChange={setActiveChatSessionId}
          />
        </TabsContent>

        {/* Additional Info Tab - Placeholder for future enhancements */}
        <TabsContent value="additional" className="flex-1 overflow-y-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Product Information</CardTitle>
              <CardDescription>
                Extended product details for sales enablement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Additional product information coming soon
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Pricing, positioning, competitive intelligence, and more
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
