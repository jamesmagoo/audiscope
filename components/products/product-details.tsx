'use client'

import { useState } from 'react'
import { useProduct } from '@/hooks/use-products'
import { useProductChat } from '@/hooks/use-product-chat'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { ProductChatTab } from './product-chat-tab'

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <ProductChatTab
        productId={productId}
        productName={name}
        activeSessionId={activeChatSessionId}
        onSessionIdChange={setActiveChatSessionId}
      />
    </div>
  )
}
