'use client'

import { ProductForm } from '@/components/products/product-form'

export default function CreateProductPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
          <p className="text-muted-foreground mt-2">
            Add a new medical device to your product catalog
          </p>
        </div>

        <ProductForm />
      </div>
    </div>
  )
}
