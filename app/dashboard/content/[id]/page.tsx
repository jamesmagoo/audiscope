'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuizEditor } from '@/components/content/quiz-editor'

export default function ContentEditorPage() {
  const params = useParams()
  const router = useRouter()
  const contentId = params.id as string

  const handlePublished = () => {
    // Navigate back to content management after publishing
    router.push('/dashboard/content')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/content')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Content Management
        </Button>
      </div>

      {/* Quiz Editor */}
      <QuizEditor contentId={contentId} onPublished={handlePublished} />
    </div>
  )
}
