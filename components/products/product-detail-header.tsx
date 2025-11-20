'use client'

import NextImage from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Loader2,
  AlertCircle,
  Edit
} from 'lucide-react'
import { getProductImage, getFileDownloadUrl } from '@/lib/product-utils'
import { useProduct } from '@/hooks/use-products'

interface ProductDetailHeaderProps {
  id: string
}

export function ProductDetailHeader({ id }: ProductDetailHeaderProps) {
  const { data: product, isLoading } = useProduct(id)

  if (isLoading || !product) {
    return (
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  // Extract product data with multiple naming conventions support
  const productId = (product as any).id || product.productID || (product as any).ProductID || id
  const name = product.name || (product as any).Name || 'Unnamed Product'
  const manufacturer = product.manufacturer || (product as any).Manufacturer || 'Unknown'
  const modelNumber = (product as any).model_number || product.modelNumber || (product as any).ModelNumber || 'N/A'
  const category = product.category || (product as any).Category || 'other'
  const status = product.status || (product as any).Status || 'draft'
  const createdAt = (product as any).created_at || product.createdAt || (product as any).CreatedAt
  const files = product.files || (product as any).Files || []

  // Extract product image
  const productImage = getProductImage(files)
  const imageUrl = productImage ? getFileDownloadUrl(productImage) : null
  const imageStatus = productImage
    ? (productImage.processing_status || productImage.processingStatus || productImage.ProcessingStatus || 'unknown')
    : null
  const isImageProcessing = imageStatus === 'pending' || imageStatus === 'processing'
  const isImageFailed = imageStatus === 'failed'
  const imageError = productImage ? (productImage.processing_error) : null

  // File count
  const totalFiles = files.length

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4 p-3 md:p-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg border overflow-hidden bg-muted/20 flex items-center justify-center">
          {imageUrl && !isImageProcessing && !isImageFailed ? (
            <NextImage
              src={imageUrl}
              alt={name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : isImageProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : isImageFailed ? (
            <AlertCircle className="h-5 w-5 text-destructive" title={imageError || 'Upload failed'} />
          ) : (
            <Package className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Product Info - Center */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{name}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {manufacturer} • {modelNumber}
          </p>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-shrink-0">
          <Badge variant="outline" className="capitalize text-xs">
            {category}
          </Badge>
          <Badge
            variant={status === 'active' ? 'default' : 'secondary'}
            className="capitalize text-xs"
          >
            {status}
          </Badge>
        </div>

        {/* Actions - Right */}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>
    </div>
  )
}
