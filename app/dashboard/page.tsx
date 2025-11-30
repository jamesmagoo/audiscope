"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Database,
  GraduationCap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  FileText,
  Clock,
  Target,
  BookOpen,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/header"
import { useAuth } from "@/components/providers/auth-provider"

export default function Dashboard() {
  const { user } = useAuth()

  // Extract user's first name from email or use generic greeting
  const getFirstName = () => {
    if (!user?.email) return "there"
    const emailName = user.email.split('@')[0]
    return emailName.charAt(0).toUpperCase() + emailName.slice(1)
  }

  // Mock data for engaging dashboard
  const stats = {
    productsAvailable: 24,
    questionsAnswered: 127,
    learningPathsActive: 3,
    completionRate: 68,
    recentActivity: [
      { id: 1, action: "Completed", item: "Product Safety Training Module", time: "2 hours ago", icon: Award, color: "text-green-600" },
      { id: 2, action: "Reviewed", item: "Cardiac Valve IFU Documentation", time: "Yesterday", icon: FileText, color: "text-blue-600" },
      { id: 3, action: "Asked AI", item: "Contraindications for pediatric use", time: "2 days ago", icon: Brain, color: "text-purple-600" },
      { id: 4, action: "Started", item: "Advanced Device Training Path", time: "3 days ago", icon: Target, color: "text-amber-600" }
    ],
    recommendations: [
      {
        title: "Complete Your Learning Path",
        description: "2 modules remaining in Advanced Device Training",
        action: "Continue Learning",
        href: "/dashboard/learning",
        icon: GraduationCap,
        color: "from-blue-500 to-cyan-500"
      },
      {
        title: "Explore New Products",
        description: "3 new products added to the library this week",
        action: "Browse Products",
        href: "/dashboard/products",
        icon: Database,
        color: "from-purple-500 to-pink-500"
      },
      {
        title: "Ask the AI Assistant",
        description: "Get instant answers from technical documentation",
        action: "Start Chat",
        href: "/dashboard/assistant",
        icon: Sparkles,
        color: "from-amber-500 to-orange-500"
      }
    ]
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <DashboardHeader
        title={`Welcome back, ${getFirstName()}`}
        description="Your intelligent platform for MedTech training, product mastery, and clinical excellence"
      />

      {/* Hero Welcome Section */}
      <Card className="relative overflow-hidden border-none shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10"></div>
        <CardContent className="relative p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Powered by AI
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Accelerate your clinical proficiency
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                Access {stats.productsAvailable} AI-ready products, complete training paths, and get instant answers from your technical documentation.
              </p>
            </div>
            <Button size="lg" className="shadow-lg" asChild>
              <Link href="/dashboard/products">
                Explore Product Library
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Showcase Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* AI Product Assistant */}
        <Link href="/dashboard/assistant">
          <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription className="text-xs font-medium">AI Product Assistant</CardDescription>
                <CardTitle className="text-2xl font-bold">{stats.questionsAnswered}</CardTitle>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Questions answered this week
              </p>
              <div className="flex items-center gap-2 text-xs">
                <MessageSquare className="h-3 w-3" />
                <span className="font-medium">Get instant, cited answers</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Product Library */}
        <Link href="/dashboard/products">
          <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription className="text-xs font-medium">Product Library</CardDescription>
                <CardTitle className="text-2xl font-bold">{stats.productsAvailable}</CardTitle>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                AI-ready products available
              </p>
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-3 w-3" />
                <span className="font-medium">IFUs, specs, and training materials</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Learning & Training */}
        <Link href="/dashboard/learning">
          <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardDescription className="text-xs font-medium">Learning & Training</CardDescription>
                <CardTitle className="text-2xl font-bold">{stats.learningPathsActive}</CardTitle>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Learning paths in progress
              </p>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">{stats.completionRate}% completion rate</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout: Activity + Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions and progress</CardDescription>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-4 group">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors`}>
                      <Icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        <span className={activity.color}>{activity.action}</span> {activity.item}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommended for You */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>Continue your learning journey</CardDescription>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recommendations.map((rec, index) => {
                const Icon = rec.icon
                return (
                  <Link key={index} href={rec.href}>
                    <Card className="group hover:shadow-md transition-all border-border/50 hover:border-primary/30 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${rec.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                  {rec.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {rec.description}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Learning Progress</CardTitle>
              <CardDescription>Track your journey to clinical excellence</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/learning">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Completion</span>
                <span className="text-muted-foreground">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>

            {/* Learning Path Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Modules Completed</span>
                </div>
                <p className="text-2xl font-bold">12 <span className="text-sm text-muted-foreground font-normal">/ 18</span></p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Certifications</span>
                </div>
                <p className="text-2xl font-bold">4 <span className="text-sm text-muted-foreground font-normal">earned</span></p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <p className="text-2xl font-bold">7 <span className="text-sm text-muted-foreground font-normal">days</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
