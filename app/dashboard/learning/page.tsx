import { Suspense } from 'react'
import { LearningDashboard } from '@/components/learning/learning-dashboard'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Learning Hub | AudiScope',
  description: 'Track your learning progress and identify knowledge gaps'
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function LearningPage({ searchParams }: PageProps) {
  // Extract product ID from query params if present
  const productId = typeof searchParams.product === 'string'
    ? searchParams.product
    : undefined

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Suspense fallback={<LoadingState />}>
        <LearningDashboard productId={productId} />
      </Suspense>
    </div>
  )
}
