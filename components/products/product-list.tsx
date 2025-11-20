'use client'

import { useProducts } from '@/hooks/use-products'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Sparkles, MessageSquare, BookOpen } from 'lucide-react'
import { getProductImage, getFileDownloadUrl } from '@/lib/product-utils'
import { ProductCard } from './product-card'

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
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <div className="max-w-md text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">AI-Powered Product Training</h3>
              <p className="text-sm text-muted-foreground">
                Upload product documentation and unlock AI-powered training, Q&A, and competitive insights
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-left">
                <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Ask Questions</p>
                  <p className="text-muted-foreground text-xs">Get instant answers from product documentation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Practice & Learn</p>
                  <p className="text-muted-foreground text-xs">Interactive demos and concept quizzes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">AI Guidance</p>
                  <p className="text-muted-foreground text-xs">Personalized training and insights</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2">
              Click "Add Product" above to create your first product
            </p>
          </div>
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
          <ProductCard
            key={productId}
            productId={productId}
            name={name}
            manufacturer={manufacturer}
            modelNumber={modelNumber}
            category={category}
            description={description}
            imageUrl={imageUrl}
            totalFiles={totalFiles}
          />
        )
      })}
    </div>
  )
}
