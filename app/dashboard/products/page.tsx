'use client'

import Link from 'next/link'
import { Plus, Sparkles, FileText, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DashboardHeader } from '@/components/dashboard/header'
import { ProductList } from '@/components/products/product-list'
import { ProductStats } from '@/components/products/product-stats'

export default function ProductsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        title="Product Library"
        description="Learn, practice, and demonstrate medical devices with AI guidance"
        action={
          <Link href="/dashboard/products/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        }
      />

      {/* Quick Stats/Insights Bar */}
      <ProductStats />

      <ProductList />
    </div>
  )
}
