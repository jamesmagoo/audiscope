"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, FileText, Upload, Users } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/header"
import apiClient, {AssessmentRecord} from "@/lib/aws-api.service";

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

  // Calculate average score
  const scoresArray = completedAssessments
    .map((a) => {
      try {
        if (a.analysis) {
          const analysis = JSON.parse(a.analysis)
          return analysis.score || 0
        }
        return 0
      } catch {
        return 0
      }
    })
    .filter((score) => score > 0)

  const averageScore =
    scoresArray.length > 0
      ? (scoresArray.reduce((sum, score) => sum + score, 0) / scoresArray.length).toFixed(1)
      : "0.0"

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : totalAssessments}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Analysis</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : pendingAssessments}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : completedAssessments.length}</div>
            <p className="text-xs text-muted-foreground">Finished assessments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `${averageScore}/12`}</div>
            <p className="text-xs text-muted-foreground">Completed assessments</p>
          </CardContent>
        </Card>
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
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/cases">
                <FileText className="mr-2 h-4 w-4" />
                View All Cases
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
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
