'use client'

import { use, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductDetails } from "@/components/products/product-details"
import { ProductDetailHeader } from "@/components/products/product-detail-header"
import { ProductFilesSidebar } from "@/components/products/product-files-sidebar"
import { useProduct } from '@/hooks/use-products'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PanelRightOpen, PanelRightClose } from 'lucide-react'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { data: product } = useProduct(id)
  const files = product?.files || (product as any)?.Files || []
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [initialSessionId, setInitialSessionId] = useState<string | null>(null)

  // Handle sessionId query parameter on mount
  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    if (sessionId) {
      setInitialSessionId(sessionId)
    }
  }, [searchParams])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Header spans full width - fixed height */}
      <div className="flex-shrink-0 w-full">
        <ProductDetailHeader id={id} />
      </div>

      {/* Content area with sidebar below header - takes remaining height */}
      <div className="flex-1 flex min-h-0 overflow-hidden w-full">
        {/* Main content - On mobile: full width, no padding */}
        <div className="flex-1 min-w-0 overflow-hidden relative min-h-0 flex-shrink w-full md:pr-4">
          {/* Floating toggle button for files sidebar - Desktop only */}
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="h-8 w-8"
                  >
                    {sidebarOpen ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{sidebarOpen ? 'Hide files' : 'Show files'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ProductDetails id={id} initialSessionId={initialSessionId} />
        </div>

        {/* Sidebar - only shown when sidebarOpen is true, hidden on mobile */}
        {sidebarOpen && (
          <div className="hidden md:block">
            <ProductFilesSidebar
              files={files}
              productId={id}
              onUploadClick={() => {
                // TODO: Implement file upload modal or redirect
                console.log('Upload files clicked')
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
