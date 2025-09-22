"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, FileText, Upload, Users } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/header"
import  {apiClient, AssessmentRecord} from "@/lib/audio-pipeline-api.service";

export default function Dashboard() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Use records endpoint for dashboard overview
        const response = await apiClient.getRecords()
        setAssessments(response.records)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Calculate statistics
  const totalAssessments = assessments.length
  const pendingAssessments = assessments.filter((a) => a.status !== "COMPLETED").length
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED")

  // Get recent assessments (last 3)
  const recentAssessments = [...assessments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  // Function to get status display text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completed"
      case "TRANSCRIBING":
        return "Processing"
      case "PENDING":
        return "Pending"
      case "ERROR":
        return "Error"
      default:
        return status
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader
        title="Dashboard"
        description="Welcome to AudiScope EVeNTs Assessor"
        action={
          <Button asChild>
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Assessment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/cases">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-foreground">{loading ? "..." : totalAssessments}</div>
              <p className="text-sm text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/cases?status=pending">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Analysis</CardTitle>
              <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-foreground">{loading ? "..." : pendingAssessments}</div>
              <p className="text-sm text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/cases?status=completed">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-foreground">{loading ? "..." : completedAssessments.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Finished assessments</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Your most recent EVeNTs assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : recentAssessments.length > 0 ? (
                recentAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{assessment.lead_surgeon}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span
                        className={
                          assessment.status === "COMPLETED"
                            ? "text-green-500"
                            : assessment.status === "TRANSCRIBING"
                              ? "text-amber-500"
                              : assessment.status === "ERROR"
                                ? "text-red-500"
                                : "text-blue-500"
                        }
                      >
                        {getStatusDisplay(assessment.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No assessments yet</div>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/cases">View all cases</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" asChild>
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Assessment
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/cases">
                <FileText className="mr-2 h-4 w-4" />
                View All Cases
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/dashboard/analytics">
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
