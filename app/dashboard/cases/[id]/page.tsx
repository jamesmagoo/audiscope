import { DashboardHeader } from "@/components/dashboard/header"
import { CaseDetails } from "@/components/cases/case-details"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"

interface CasePageProps {
  params: {
    id: string
  }
}

export default function CasePage({ params }: CasePageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        title={`Case #${params.id}`}
        description="Assessment details and results"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/cases">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cases
              </Link>
            </Button>
          </div>
        }
      />

      <CaseDetails id={params.id} />
    </div>
  )
}
