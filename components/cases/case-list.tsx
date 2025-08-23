"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, FileText, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import apiClient, { type AssessmentRecord } from "@/lib/aws-api.service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CaseListProps {
  statusFilter?: string
  searchTerm?: string
  sortBy?: string
}

export function CaseList({ statusFilter, searchTerm, sortBy = "date-desc" }: CaseListProps) {
  const [viewType, setViewType] = useState<"table" | "cards">("cards")
  const [cases, setCases] = useState<AssessmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true)
        setError(null)
        // Use the records endpoint for overview data
        const response = await apiClient.getRecords(statusFilter)

        // Filter by search term if provided
        let filteredCases = response.records
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          filteredCases = filteredCases.filter(
            (record) =>
              record.lead_surgeon.toLowerCase().includes(searchLower) ||
              record.id.toLowerCase().includes(searchLower) ||
              record.assessor_name.toLowerCase().includes(searchLower),
          )
        }

        // Sort the cases
        filteredCases = sortCases(filteredCases, sortBy)

        setCases(filteredCases)
      } catch (err) {
        console.error("Error fetching cases:", err)
        setError(err instanceof Error ? err.message : "Failed to load cases")
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [statusFilter, searchTerm, sortBy])

  // Function to sort cases based on sortBy parameter
  const sortCases = (casesToSort: AssessmentRecord[], sortByValue: string): AssessmentRecord[] => {
    return [...casesToSort].sort((a, b) => {
      switch (sortByValue) {
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "score-asc": {
          const scoreA = getScoreFromAnalysis(a).score || 0
          const scoreB = getScoreFromAnalysis(b).score || 0
          return scoreA - scoreB
        }
        case "score-desc": {
          const scoreA = getScoreFromAnalysis(a).score || 0
          const scoreB = getScoreFromAnalysis(b).score || 0
          return scoreB - scoreA
        }
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }

  // Function to calculate score from analysis (if available) - handles both formats
  const getScoreFromAnalysis = (record: AssessmentRecord): { score: number | null; maxScore: number } => {
    if (!record.analysis || record.status !== "COMPLETED") return { score: null, maxScore: 16 }

    try {
      // ✅ Check if analysis is already an object or needs parsing
      let analysisObj: any

      if (typeof record.analysis === "string") {
        // Legacy case: analysis is still stored as string
        analysisObj = JSON.parse(record.analysis)
      } else {
        // New case: analysis is already a parsed object from backend
        analysisObj = record.analysis
      }

      // Handle EVeNTs format with nested assessment structure
      if (analysisObj.assessment?.overall_assessment?.overall_rating) {
        return {
          score: analysisObj.assessment.overall_assessment.overall_rating,
          maxScore: 16,
        }
      }

      // Handle EVeNTs format with direct overall_assessment
      if (analysisObj.overall_assessment?.overall_rating) {
        return {
          score: analysisObj.overall_assessment.overall_rating,
          maxScore: 16,
        }
      }

      // Handle legacy format with direct score
      if (analysisObj.score !== undefined) {
        return {
          score: analysisObj.score,
          maxScore: analysisObj.maxScore || 16,
        }
      }

      return { score: null, maxScore: 16 }
    } catch (e) {
      console.error("Error calculating score from analysis:", e)
      console.error("Record analysis type:", typeof record.analysis)
      return { score: null, maxScore: 16 }
    }
  }

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

  // Function to get status variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "ERROR":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading cases...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No cases found. Upload a new assessment to get started.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/upload">Upload Assessment</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        <Button variant={viewType === "table" ? "default" : "outline"} size="sm" onClick={() => setViewType("table")}>
          <FileText className="mr-1 h-4 w-4" />
          Table
        </Button>
        <Button variant={viewType === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewType("cards")}>
          <Eye className="mr-1 h-4 w-4" />
          Cards
        </Button>
      </div>

      {viewType === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Lead Surgeon</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((caseItem) => {
              const { score, maxScore } = getScoreFromAnalysis(caseItem)
              return (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.id.substring(0, 8)}</TableCell>
                  <TableCell>{caseItem.lead_surgeon}</TableCell>
                  <TableCell>{new Date(caseItem.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(caseItem.status)}>{getStatusDisplay(caseItem.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {score !== null ? (
                      <div className="flex items-center gap-2">
                        <span>
                          {score}/{maxScore}
                        </span>
                        <Progress value={(score / maxScore) * 100} className="h-2 w-16" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {caseItem.status === "COMPLETED" ? "No Score" : "Pending"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`cases/${caseItem.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem) => {
            const { score, maxScore } = getScoreFromAnalysis(caseItem)
            return (
              <Card key={caseItem.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{caseItem.lead_surgeon}</h3>
                      <p className="text-sm text-muted-foreground">ID: {caseItem.id.substring(0, 8)}</p>
                    </div>
                    <Badge variant={getStatusVariant(caseItem.status)}>{getStatusDisplay(caseItem.status)}</Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(caseItem.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assessor:</span>
                      <span>{caseItem.assessor_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Size:</span>
                      <span>{caseItem.team_member_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score:</span>
                      {score !== null ? (
                        <span>
                          {score}/{maxScore}
                        </span>
                      ) : (
                        <span>{caseItem.status === "COMPLETED" ? "No Score" : "Pending"}</span>
                      )}
                    </div>
                    {score !== null && <Progress value={(score / maxScore) * 100} className="h-2" />}
                  </div>
                  <Button className="w-full mt-4" asChild>
                    <Link href={`cases/${caseItem.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
