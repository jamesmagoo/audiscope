'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  Search,
  BookOpen,
  TrendingUp,
  Award,
  ArrowLeft
} from 'lucide-react'
import { QuizCard, type Quiz } from '@/components/training/quiz-card'
import { QuizInterface, type QuizData, type QuizQuestion } from '@/components/training/quiz-interface'
import type { QuizResult } from '@/components/training/quiz-results'

// Dummy quiz data
const DUMMY_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    productId: '1',
    productName: 'CardioGuard Pro Stent System',
    manufacturer: 'MedTech Solutions',
    title: 'Product Overview & Indications',
    description: 'Test your knowledge of the CardioGuard Pro features, indications for use, and clinical applications',
    questionCount: 10,
    estimatedTime: '12 minutes',
    difficulty: 'beginner',
    category: 'Product Knowledge',
    lastAttemptScore: 85,
    lastAttemptDate: '2 days ago',
    attempts: 2,
    bestScore: 85
  },
  {
    id: 'quiz-2',
    productId: '1',
    productName: 'CardioGuard Pro Stent System',
    manufacturer: 'MedTech Solutions',
    title: 'Safety & Contraindications',
    description: 'Comprehensive assessment of safety considerations, warnings, precautions, and patient contraindications',
    questionCount: 15,
    estimatedTime: '18 minutes',
    difficulty: 'intermediate',
    category: 'Safety & Compliance',
    lastAttemptScore: 65,
    lastAttemptDate: '2 days ago',
    attempts: 1,
    bestScore: 65
  },
  {
    id: 'quiz-3',
    productId: '3',
    productName: 'OrthoFlex Joint Replacement',
    manufacturer: 'Surgical Dynamics',
    title: 'Technical Specifications',
    description: 'Master device specifications, sizing options, material properties, and technical parameters',
    questionCount: 12,
    estimatedTime: '15 minutes',
    difficulty: 'intermediate',
    category: 'Technical Knowledge',
    lastAttemptScore: 70,
    lastAttemptDate: '3 days ago',
    attempts: 1,
    bestScore: 70
  },
  {
    id: 'quiz-4',
    productId: '2',
    productName: 'NeuroNav Surgical Navigation',
    manufacturer: 'BioMed Innovations',
    title: 'Complete Product Mastery',
    description: 'Comprehensive assessment covering all aspects of the NeuroNav system from setup to advanced applications',
    questionCount: 20,
    estimatedTime: '25 minutes',
    difficulty: 'advanced',
    category: 'Comprehensive',
    lastAttemptScore: 94,
    lastAttemptDate: '1 week ago',
    attempts: 1,
    bestScore: 94
  },
  {
    id: 'quiz-5',
    productId: '4',
    productName: 'VisionPlus Diagnostic Scope',
    manufacturer: 'Optic Medical',
    title: 'Getting Started with VisionPlus',
    description: 'Introduction to device setup, basic operation, and common procedures',
    questionCount: 8,
    estimatedTime: '10 minutes',
    difficulty: 'beginner',
    category: 'Product Knowledge',
    attempts: 0
  },
  {
    id: 'quiz-6',
    productId: '3',
    productName: 'OrthoFlex Joint Replacement',
    manufacturer: 'Surgical Dynamics',
    title: 'Advanced Surgical Techniques',
    description: 'Complex case planning, revision procedures, and troubleshooting difficult scenarios',
    questionCount: 18,
    estimatedTime: '22 minutes',
    difficulty: 'advanced',
    category: 'Clinical Application',
    attempts: 0
  }
]

// Dummy quiz data with questions
const DUMMY_QUIZ_DATA: Record<string, QuizData> = {
  'quiz-1': {
    id: 'quiz-1',
    title: 'Product Overview & Indications',
    productName: 'CardioGuard Pro Stent System',
    description: 'Test your knowledge of the CardioGuard Pro features and clinical applications',
    passThreshold: 70,
    questions: [
      {
        id: 'q1',
        questionNumber: 1,
        question: 'What is the primary indication for the CardioGuard Pro Stent System?',
        options: [
          'Treatment of coronary artery disease',
          'Peripheral vascular disease',
          'Carotid artery stenosis',
          'Venous insufficiency'
        ],
        correctAnswer: 'Treatment of coronary artery disease',
        explanation: 'The CardioGuard Pro is specifically designed for treating coronary artery disease by maintaining vessel patency after angioplasty.',
        topic: 'Indications'
      },
      {
        id: 'q2',
        questionNumber: 2,
        question: 'What material is the CardioGuard Pro stent made from?',
        options: [
          'Stainless steel',
          'Cobalt-chromium alloy',
          'Titanium alloy',
          'Nitinol'
        ],
        correctAnswer: 'Cobalt-chromium alloy',
        explanation: 'CardioGuard Pro stents are manufactured from cobalt-chromium alloy, which provides optimal radial strength with minimal strut thickness.',
        topic: 'Technical Specifications'
      },
      {
        id: 'q3',
        questionNumber: 3,
        question: 'What is the recommended deployment pressure range?',
        options: [
          '4-6 ATM',
          '8-10 ATM',
          '12-14 ATM',
          '16-18 ATM'
        ],
        correctAnswer: '8-10 ATM',
        explanation: 'The optimal deployment pressure for CardioGuard Pro is 8-10 ATM, which ensures proper stent expansion while minimizing vessel trauma.',
        topic: 'Procedure'
      },
      {
        id: 'q4',
        questionNumber: 4,
        question: 'How long should patients remain on dual antiplatelet therapy (DAPT) after stent placement?',
        options: [
          '1 month',
          '3 months',
          '6 months',
          '12 months'
        ],
        correctAnswer: '12 months',
        explanation: 'Standard protocol requires 12 months of DAPT to prevent stent thrombosis and ensure proper endothelialization.',
        topic: 'Post-Procedure Care'
      },
      {
        id: 'q5',
        questionNumber: 5,
        question: 'What is the maximum recommended vessel diameter for the CardioGuard Pro?',
        options: [
          '3.0 mm',
          '3.5 mm',
          '4.0 mm',
          '4.5 mm'
        ],
        correctAnswer: '4.0 mm',
        explanation: 'CardioGuard Pro is designed for vessels up to 4.0mm in diameter. Vessels larger than this require alternative stent options.',
        topic: 'Technical Specifications'
      }
    ] as QuizQuestion[]
  }
}

export default function TrainingPage() {
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')

  // Filter quizzes
  const filteredQuizzes = DUMMY_QUIZZES.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDifficulty = selectedDifficulty === 'all' || quiz.difficulty === selectedDifficulty
    const matchesProduct = selectedProduct === 'all' || quiz.productId === selectedProduct

    return matchesSearch && matchesDifficulty && matchesProduct
  })

  // Get unique products
  const products = Array.from(new Set(DUMMY_QUIZZES.map(q => ({ id: q.productId, name: q.productName }))))

  // Handle quiz start
  const handleStartQuiz = (quizId: string) => {
    // In a real app, fetch quiz data from API
    const quizData = DUMMY_QUIZ_DATA[quizId]
    if (quizData) {
      setActiveQuiz(quizData)
    } else {
      // Fallback for quizzes without full data
      alert('This quiz is not yet available. This is a demo with limited quiz data.')
    }
  }

  // Handle quiz complete
  const handleQuizComplete = (result: QuizResult) => {
    console.log('Quiz completed:', result)
    // In a real app, save result to backend
  }

  // Handle quiz exit
  const handleQuizExit = () => {
    setActiveQuiz(null)
  }

  // Calculate stats
  const totalQuizzes = DUMMY_QUIZZES.length
  const attemptedQuizzes = DUMMY_QUIZZES.filter(q => q.attempts > 0).length
  const masteredQuizzes = DUMMY_QUIZZES.filter(q => (q.bestScore ?? 0) >= 90).length

  // If taking a quiz, show quiz interface
  if (activeQuiz) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Button
          variant="ghost"
          onClick={handleQuizExit}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        <QuizInterface
          quiz={activeQuiz}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      </div>
    )
  }

  // Quiz library view
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Hero Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Training & Assessments</h1>
            <p className="text-muted-foreground mb-4">
              Test your knowledge with AI-generated quizzes and track your progress across all products
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <strong>{totalQuizzes}</strong> quizzes available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>{attemptedQuizzes}</strong> attempted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">
                  <strong>{masteredQuizzes}</strong> mastered
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Quiz Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map(quiz => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStart={handleStartQuiz}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search term
          </p>
        </Card>
      )}
    </div>
  )
}
