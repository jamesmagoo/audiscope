'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard/header'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuizGenerationForm } from '@/components/content/quiz-generation-form'
import { GeneratedContentTable } from '@/components/content/generated-content-table'

export default function ContentManagementPage() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const router = useRouter()

  const handleGenerateSuccess = (generationId: string) => {
    setShowGenerateDialog(false)
    // Navigate to editor page
    router.push(`/dashboard/content/${generationId}`)
  }

  const handleViewContent = (generationId: string) => {
    router.push(`/dashboard/content/${generationId}`)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        title="Content Management"
        description="Create and manage AI-generated learning content from product documentation"
        action={
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Content
          </Button>
        }
      />

      {/* Generated Content Table */}
      <GeneratedContentTable onViewContent={handleViewContent} />

      {/* Generate Quiz Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Quiz Content</DialogTitle>
          </DialogHeader>
          <QuizGenerationForm onSuccess={handleGenerateSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
