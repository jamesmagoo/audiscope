'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/hooks/use-products'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package } from 'lucide-react'
import { getProductImage, getFileDownloadUrl } from '@/lib/product-utils'

interface ProductListProps {
  searchTerm?: string
  category?: string
  sortBy?: string
}

export function ProductList({ searchTerm, category, sortBy }: ProductListProps) {
  const { data: products, isLoading, error } = useProducts()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading products: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  // Handle different response structures
  const productsArray = Array.isArray(products) ? products : []

  if (productsArray.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first product to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  // TODO: Implement filtering and sorting
  let filteredProducts = productsArray

  if (searchTerm) {
    filteredProducts = filteredProducts.filter((p: any) => {
      const name = p.name || p.Name || ''
      const manufacturer = p.manufacturer || p.Manufacturer || ''
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }

  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter((p: any) => {
      const productCategory = p.category || p.Category
      return productCategory === category
    })
  }

  return (
    <div className="space-y-4">
      {filteredProducts.map((product: any, index: number) => {
        // Handle multiple naming conventions: id, productID, ProductID
        const productId = product.id || product.productID || product.ProductID
        const name = product.name || product.Name || 'Unnamed Product'
        const manufacturer = product.manufacturer || product.Manufacturer || 'Unknown'
        const modelNumber = product.model_number || product.modelNumber || product.ModelNumber || 'N/A'
        const category = product.category || product.Category || 'other'
        const description = product.description || product.Description
        const files = product.files || product.Files
        const totalFiles = product.total_files || product.totalFiles || product.TotalFiles || 0

        // Skip products without valid IDs
        if (!productId) {
          console.warn('ProductList: Product missing ID, skipping:', product)
          return null
        }

        // Extract product image
        const productImage = getProductImage(files)
        const imageUrl = productImage ? getFileDownloadUrl(productImage) : null

        return (
          <Link key={productId} href={`/dashboard/products/${productId}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer mb-2">
              <div className="flex items-start p-6 gap-4">
                {/* Product Image Thumbnail */}
                <div className="flex-shrink-0 w-20 h-20 rounded-lg border overflow-hidden bg-muted/20 flex items-center justify-center">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-lg">{name}</CardTitle>
                      <CardDescription>
                        {manufacturer} • Model: {modelNumber}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">{category}</Badge>
                  </div>

                  {description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {description}
                    </p>
                  )}

                  {totalFiles > 0 && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {totalFiles} file{totalFiles !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
