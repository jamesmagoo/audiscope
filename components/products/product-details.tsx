'use client'

import { useState } from 'react'
import { useProduct } from '@/hooks/use-products'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { ProductChatTab } from './product-chat-tab'
import { MobileProductChat } from './mobile-product-chat'

interface ProductDetailsProps {
  id: string
  initialSessionId?: string | null
}

export function ProductDetails({ id, initialSessionId }: ProductDetailsProps) {
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(initialSessionId || null)
  const { data: product, isLoading, error } = useProduct(id)

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
  const productTitle = product.name || (product as any).ProductName || name
  const files = product.files || (product as any)?.Files || []

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      {/* Desktop Chat - Hidden on mobile */}
      <div className="hidden md:flex md:flex-col h-full w-full min-h-0">
        <ProductChatTab
          productId={productId}
          productName={name}
          activeSessionId={activeChatSessionId}
          onSessionIdChange={setActiveChatSessionId}
        />
      </div>

      {/* Mobile Chat - Hidden on desktop */}
      <MobileProductChat
        productId={productId}
        productName={name}
        productTitle={productTitle}
        files={files}
      />
    </div>
  )
}
