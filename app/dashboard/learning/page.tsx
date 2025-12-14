import { Suspense } from 'react'
import { LearningDashboard } from '@/components/learning/learning-dashboard'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Learning Hub | Landy AI',
  description: 'Track your learning progress and identify knowledge gaps'
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default async function LearningPage({ searchParams }: PageProps) {
  // Extract product ID from query params if present
  const params = await searchParams
  const productId = typeof params.product === 'string'
    ? params.product
    : undefined

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Suspense fallback={<LoadingState />}>
        <LearningDashboard productId={productId} />
      </Suspense>
    </div>
  )
}
