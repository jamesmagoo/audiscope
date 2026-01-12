'use client'

import { useState } from 'react'
import { Loader2, FileQuestion, Filter, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuizCard } from './quiz-card'
import { useAllQuizzes } from '@/hooks/use-learning'
import { useProducts } from '@/hooks/use-products'
import type { QuizCompletionStatus } from '@/lib/types/learning'

export function QuizList() {
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<QuizCompletionStatus | 'all'>('all')

  const { data: productsData } = useProducts()
  const { data: allQuizzes, isLoading, error } = useAllQuizzes()

  // Filter quizzes based on selected product and status
  const filteredQuizzes = allQuizzes?.filter((quiz) => {
    const productMatch = selectedProduct === 'all' || quiz.product_id === selectedProduct
    const statusMatch = statusFilter === 'all' || quiz.completion_status === statusFilter
    return productMatch && statusMatch
  })

  const hasActiveFilters = selectedProduct !== 'all' || statusFilter !== 'all'

  const clearFilters = () => {
    setSelectedProduct('all')
    setStatusFilter('all')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Quizzes</CardTitle>
          <CardDescription>Test your knowledge with interactive quizzes</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading quizzes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Quizzes</CardTitle>
          <CardDescription>Test your knowledge with interactive quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {(error as any)?.message || 'Failed to load quizzes. Please try again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5" />
                Available Quizzes
              </CardTitle>
              <CardDescription>
                {filteredQuizzes?.length || 0} quiz{filteredQuizzes?.length !== 1 ? 'zes' : ''} available
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {productsData?.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="not_started">Not Started</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quiz Grid */}
      {filteredQuizzes && filteredQuizzes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more quizzes.'
                : 'No quizzes are available yet. Check back later!'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
