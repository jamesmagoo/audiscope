'use client'

import { formatDistanceToNow } from 'date-fns'
import { Loader2, Eye, FileQuestion } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUserAttempts } from '@/hooks/use-learning'
import { useRouter } from 'next/navigation'

interface PreviousAttemptsTableProps {
  quizId: string
}

export function PreviousAttemptsTable({ quizId }: PreviousAttemptsTableProps) {
  const { data: allAttempts, isLoading, error } = useUserAttempts()
  const router = useRouter()

  // Filter attempts for this specific quiz
  const quizAttempts = allAttempts?.filter((attempt) => attempt.quiz_id === quizId) || []

  // Sort by started_at (newest first) and filter out in_progress attempts for the table
  const completedAttempts = quizAttempts
    .filter((attempt) => attempt.status === 'completed')
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  // Number attempts (oldest = 1, newest = highest)
  const attemptsWithNumber = completedAttempts.map((attempt, index) => ({
    ...attempt,
    attemptNumber: completedAttempts.length - index,
  }))

  const getScoreBadge = (score?: number) => {
    if (score === undefined) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          N/A
        </Badge>
      )
    }

    if (score >= 80) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {score}%
        </Badge>
      )
    } else if (score >= 60) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          {score}%
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {score}%
        </Badge>
      )
    }
  }

  const handleViewResults = (attemptId: string) => {
    router.push(`/dashboard/learning/quiz/${quizId}/results?attemptId=${attemptId}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previous Attempts</CardTitle>
          <CardDescription>Review your past quiz attempts and scores</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading attempts...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previous Attempts</CardTitle>
          <CardDescription>Review your past quiz attempts and scores</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {(error as any)?.message || 'Failed to load attempts. Please try again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (attemptsWithNumber.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previous Attempts</CardTitle>
          <CardDescription>Review your past quiz attempts and scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No previous attempts</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You haven't completed this quiz yet. Start the quiz to see your first attempt here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous Attempts</CardTitle>
        <CardDescription>
          {attemptsWithNumber.length} attempt{attemptsWithNumber.length !== 1 ? 's' : ''} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attempt #</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attemptsWithNumber.map((attempt) => (
              <TableRow key={attempt.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">Attempt {attempt.attemptNumber}</TableCell>
                <TableCell>{getScoreBadge(attempt.score)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(attempt.completed_at || attempt.started_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewResults(attempt.id)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
