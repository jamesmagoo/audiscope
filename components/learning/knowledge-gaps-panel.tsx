'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  TrendingDown,
  BookOpen,
  FileText,
  Target,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface KnowledgeGap {
  id: string
  productId: string
  productName: string
  topic: string
  description: string
  currentScore: number
  targetScore: number
  severity: 'critical' | 'moderate' | 'minor'
  recommendations: Recommendation[]
  lastAttempted: string
}

interface Recommendation {
  id: string
  type: 'review' | 'quiz' | 'practice'
  title: string
  description: string
  estimatedTime: string
  resourceLink?: string
}

interface KnowledgeGapsPanelProps {
  gaps: KnowledgeGap[]
}

const SEVERITY_CONFIG = {
  critical: {
    label: 'Needs Attention',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-100 text-red-700'
  },
  moderate: {
    label: 'Room for Improvement',
    icon: TrendingDown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-700'
  },
  minor: {
    label: 'Minor Gap',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700'
  }
}

const RECOMMENDATION_ICONS = {
  review: FileText,
  quiz: Target,
  practice: BookOpen
}

export function KnowledgeGapsPanel({ gaps }: KnowledgeGapsPanelProps) {
  if (gaps.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Great job!</h3>
            <p className="text-sm text-muted-foreground">
              No significant knowledge gaps detected. Keep up the excellent work!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Gaps</h3>
          <p className="text-sm text-muted-foreground">
            Areas identified for improvement based on your recent performance
          </p>
        </div>
        <Badge variant="secondary">{gaps.length} gap{gaps.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="grid gap-4">
        {gaps.map((gap) => {
          const severityConfig = SEVERITY_CONFIG[gap.severity]
          const SeverityIcon = severityConfig.icon
          const scoreGap = gap.targetScore - gap.currentScore

          return (
            <Card
              key={gap.id}
              className={`p-5 border-l-4 ${severityConfig.borderColor}`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${severityConfig.bgColor} flex-shrink-0`}>
                  <SeverityIcon className={`h-5 w-5 ${severityConfig.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="font-semibold">{gap.topic}</h4>
                      <p className="text-sm text-muted-foreground">{gap.productName}</p>
                    </div>
                    <Badge variant="secondary" className={severityConfig.badgeColor}>
                      {severityConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{gap.description}</p>

                  {/* Score Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Score</span>
                      <span className="font-medium">
                        {gap.currentScore}% / {gap.targetScore}%
                      </span>
                    </div>
                    <Progress value={gap.currentScore} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      You need {scoreGap}% improvement to reach your target
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recommended Actions:</p>
                    {gap.recommendations.slice(0, 2).map((rec) => {
                      const RecIcon = RECOMMENDATION_ICONS[rec.type]
                      return (
                        <div
                          key={rec.id}
                          className="flex items-start gap-2 p-3 bg-background rounded-lg border text-sm"
                        >
                          <RecIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-xs text-muted-foreground mb-1">
                              {rec.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ⏱ {rec.estimatedTime}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {/* Action Button */}
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/training?product=${gap.productId}&topic=${encodeURIComponent(gap.topic)}`}>
                        Start Improving
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    Last attempted: {gap.lastAttempted}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
