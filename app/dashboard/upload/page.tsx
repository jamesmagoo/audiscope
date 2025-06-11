import { DashboardHeader } from "@/components/dashboard/header"
import { UploadAssessment } from "@/components/upload/upload-assessment"

export default function UploadPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader title="Upload Assessment" description="Upload a new EVeNTs assessment for analysis" />

      <div className="max-w-3xl mx-auto">
        <UploadAssessment />
      </div>
    </div>
  )
}
