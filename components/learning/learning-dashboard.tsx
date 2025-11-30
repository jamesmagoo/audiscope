'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { ProgressTracker } from './progress-tracker'
import { KnowledgeGapsPanel } from './knowledge-gaps-panel'
import { LearningPathCard } from './learning-path-card'
import Link from 'next/link'

// Dummy data for demonstration
const DUMMY_PROGRESS = [
  {
    productId: '1',
    productName: 'CardioGuard Pro Stent System',
    manufacturer: 'MedTech Solutions',
    overallProgress: 85,
    quizzesCompleted: 6,
    totalQuizzes: 8,
    averageScore: 88,
    lastStudied: '2 days ago',
    status: 'in-progress' as const
  },
  {
    productId: '2',
    productName: 'NeuroNav Surgical Navigation',
    manufacturer: 'BioMed Innovations',
    overallProgress: 100,
    quizzesCompleted: 5,
    totalQuizzes: 5,
    averageScore: 94,
    lastStudied: '1 week ago',
    status: 'mastered' as const
  },
  {
    productId: '3',
    productName: 'OrthoFlex Joint Replacement',
    manufacturer: 'Surgical Dynamics',
    overallProgress: 45,
    quizzesCompleted: 3,
    totalQuizzes: 10,
    averageScore: 72,
    lastStudied: '3 days ago',
    status: 'in-progress' as const
  },
  {
    productId: '4',
    productName: 'VisionPlus Diagnostic Scope',
    manufacturer: 'Optic Medical',
    overallProgress: 0,
    quizzesCompleted: 0,
    totalQuizzes: 6,
    averageScore: 0,
    lastStudied: 'Never',
    status: 'not-started' as const
  }
]

const DUMMY_GAPS = [
  {
    id: 'gap-1',
    productId: '1',
    productName: 'CardioGuard Pro Stent System',
    topic: 'Contraindications & Warnings',
    description: 'Recent quiz performance indicates confusion about patient contraindications and safety warnings',
    currentScore: 65,
    targetScore: 90,
    severity: 'critical' as const,
    lastAttempted: '2 days ago',
    recommendations: [
      {
        id: 'rec-1',
        type: 'review' as const,
        title: 'Review Instructions for Use - Section 4',
        description: 'Focus on contraindications, warnings, and precautions',
        estimatedTime: '15 minutes'
      },
      {
        id: 'rec-2',
        type: 'quiz' as const,
        title: 'Retake Safety & Contraindications Quiz',
        description: 'Test your knowledge after reviewing the materials',
        estimatedTime: '10 minutes'
      }
    ]
  },
  {
    id: 'gap-2',
    productId: '3',
    productName: 'OrthoFlex Joint Replacement',
    topic: 'Technical Specifications',
    description: 'Inconsistent performance on questions related to device specifications and sizing',
    currentScore: 70,
    targetScore: 85,
    severity: 'moderate' as const,
    lastAttempted: '3 days ago',
    recommendations: [
      {
        id: 'rec-3',
        type: 'review' as const,
        title: 'Study Technical Specifications Document',
        description: 'Review sizing charts, material specifications, and technical parameters',
        estimatedTime: '20 minutes'
      },
      {
        id: 'rec-4',
        type: 'practice' as const,
        title: 'Practice Sizing Selection Scenarios',
        description: 'Work through case-based sizing scenarios',
        estimatedTime: '15 minutes'
      }
    ]
  }
]

const DUMMY_LEARNING_PATHS = [
  {
    id: 'path-1',
    title: 'CardioGuard Mastery Path',
    description: 'Complete mastery of the CardioGuard Pro Stent System from basics to advanced techniques',
    productId: '1',
    productName: 'CardioGuard Pro Stent System',
    totalSteps: 8,
    completedSteps: 5,
    estimatedTime: '3 hours',
    difficulty: 'intermediate' as const,
    recommended: true,
    steps: [
      {
        id: 'step-1',
        title: 'Product Overview & Indications',
        description: 'Learn basic product features and clinical indications',
        duration: '20 min',
        completed: true
      },
      {
        id: 'step-2',
        title: 'Technical Specifications',
        description: 'Master device specifications and sizing',
        duration: '25 min',
        completed: true
      },
      {
        id: 'step-3',
        title: 'Contraindications & Warnings',
        description: 'Understand safety considerations and contraindications',
        duration: '20 min',
        completed: false
      },
      {
        id: 'step-4',
        title: 'Procedure Walkthrough',
        description: 'Step-by-step procedure guidance',
        duration: '30 min',
        completed: false
      }
    ]
  },
  {
    id: 'path-2',
    title: 'VisionPlus Quick Start',
    description: 'Get up to speed quickly with the VisionPlus Diagnostic Scope essentials',
    productId: '4',
    productName: 'VisionPlus Diagnostic Scope',
    totalSteps: 6,
    completedSteps: 0,
    estimatedTime: '1.5 hours',
    difficulty: 'beginner' as const,
    recommended: true,
    steps: [
      {
        id: 'step-5',
        title: 'Device Setup & Calibration',
        description: 'Learn proper setup and calibration procedures',
        duration: '15 min',
        completed: false
      },
      {
        id: 'step-6',
        title: 'Basic Operation',
        description: 'Master core operational procedures',
        duration: '20 min',
        completed: false
      }
    ]
  },
  {
    id: 'path-3',
    title: 'OrthoFlex Advanced Techniques',
    description: 'Advanced surgical techniques and troubleshooting for OrthoFlex Joint Replacement',
    productId: '3',
    productName: 'OrthoFlex Joint Replacement',
    totalSteps: 10,
    completedSteps: 3,
    estimatedTime: '4 hours',
    difficulty: 'advanced' as const,
    recommended: false,
    steps: [
      {
        id: 'step-7',
        title: 'Complex Case Planning',
        description: 'Planning for difficult anatomical variations',
        duration: '30 min',
        completed: false
      },
      {
        id: 'step-8',
        title: 'Revision Procedures',
        description: 'Handling revision cases and complications',
        duration: '35 min',
        completed: false
      }
    ]
  }
]

interface LearningDashboardProps {
  productId?: string // If provided, filter to specific product
}

export function LearningDashboard({ productId }: LearningDashboardProps) {
  // Filter data if productId is provided
  const progress = productId
    ? DUMMY_PROGRESS.filter(p => p.productId === productId)
    : DUMMY_PROGRESS

  const gaps = productId
    ? DUMMY_GAPS.filter(g => g.productId === productId)
    : DUMMY_GAPS

  const learningPaths = productId
    ? DUMMY_LEARNING_PATHS.filter(path => path.productId === productId)
    : DUMMY_LEARNING_PATHS

  // Calculate summary stats
  const totalGaps = gaps.length
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length
  const activeProducts = progress.filter(p => p.status === 'in-progress').length

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      {!productId && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Your Learning Hub</h2>
              <p className="text-muted-foreground mb-4">
                Track your progress, identify knowledge gaps, and follow personalized learning paths
                to master medical device products.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default" asChild>
                  <Link href="/dashboard/training">
                    Start a Quiz
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/products">
                    Browse Products
                    <BookOpen className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeProducts}</p>
              <p className="text-sm text-muted-foreground">Active Learning</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalGaps}</p>
              <p className="text-sm text-muted-foreground">Knowledge Gaps</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{learningPaths.filter(p => p.recommended).length}</p>
              <p className="text-sm text-muted-foreground">Recommended Paths</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gaps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Knowledge Gaps
            {criticalGaps > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {criticalGaps}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paths" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Learning Paths
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="mt-6">
          <KnowledgeGapsPanel gaps={gaps} />
        </TabsContent>

        <TabsContent value="paths" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {learningPaths.map((path) => (
              <LearningPathCard key={path.id} path={path} />
            ))}
          </div>
          {learningPaths.length === 0 && (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No learning paths available</h3>
              <p className="text-sm text-muted-foreground">
                Start by taking a quiz to generate personalized learning recommendations
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressTracker products={progress} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
