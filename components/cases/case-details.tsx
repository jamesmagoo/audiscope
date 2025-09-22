"use client"

import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion"
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    CircleAlert,
    CircleX,
    Eye,
    EyeOff,
    Loader2,
    MessageSquare,
    Target,
    TrendingUp,
} from "lucide-react"
import apiClient, {type AssessmentRecord, AudioSegment} from "@/lib/audio-pipeline-api.service"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"

interface CaseDetailsProps {
    id: string
}

const parseAssessmentResults = (record: AssessmentRecord) => {
    const defaultResult = {
        overall_assessment: null as any,
        rating_definitions: null as any,
        categories: null as any,
        transcript: [] as any[],
        audio_segments: [] as AudioSegment[],
        score: null as number | null,
        maxScore: 16,
    }

    // Parse audio segments first (outside try-catch to avoid scope issues)
    let audio_segments: AudioSegment[] = []
    if (record.audio_segments) {
        audio_segments = record.audio_segments;
    }

    if (!record.analysis || record.status !== "COMPLETED") {
        return {
            ...defaultResult,
            audio_segments: audio_segments
        }
    }

    // Add this at the start of parseAssessmentResults for debugging
    console.log("Raw record.analysis:", record.analysis);
    console.log("Type of record.analysis:", typeof record.analysis);
    console.log("JSON.stringify(record.analysis):", JSON.stringify(record.analysis, null, 2));

    try {
        // ✅ Check if analysis is already an object or needs parsing
        let analysisObj: any;

        if (typeof record.analysis === 'string') {
            // Legacy case: analysis is still stored as string
            analysisObj = JSON.parse(record.analysis);
        } else {
            // New case: analysis is already a parsed object from backend
            analysisObj = record.analysis;
        }

        // Parse transcript from transcript_block if available
        let transcript: string = ''
        if (record.transcript_block) {
            try {
                // Handle transcript_block which might still be a string
                if (typeof record.transcript_block === 'string') {
                    // transcript = JSON.parse(record.transcript_block)
                    transcript = record.transcript_block
                } else {
                    transcript = record.transcript_block
                }
            } catch (e) {
                console.error("Error parsing transcript:", e)
            }
        }

        // Handle both the old format (with score/skills) and new format (with overall_assessment/categories)
        if (analysisObj.assessment?.overall_assessment && analysisObj.assessment?.categories) {
            // New EVeNTs format - note the nested structure
            return {
                overall_assessment: analysisObj.assessment.overall_assessment || null,
                rating_definitions: analysisObj.assessment.rating_definitions || null,
                categories: analysisObj.assessment.categories || null,
                transcript: transcript,
                audio_segments: audio_segments,
                score: null,
                maxScore: 16,
            }
        }

        return {
            ...defaultResult,
            audio_segments: audio_segments
        }
    } catch (e) {
        console.error("Error parsing analysis:", e)
        console.error("Record analysis type:", typeof record.analysis)
        console.error("Record analysis value:", record.analysis)
        return {
            ...defaultResult,
            audio_segments: audio_segments
        }
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

// Function to get rating color and label - 16-point scale
const getRatingDisplayOverall = (rating: number | null) => {
    if (rating === null) return {color: "text-muted-foreground", label: "N/A", bgColor: "bg-muted"}

    switch (true) {
        case rating >= 13:
            return {color: "text-green-600", label: "Excellent", bgColor: "bg-green-100"}
        case rating >= 10:
            return {color: "text-blue-600", label: "Good", bgColor: "bg-blue-100"}
        case rating >= 7:
            return {color: "text-amber-600", label: "Acceptable", bgColor: "bg-amber-100"}
        case rating >= 4:
            return {color: "text-orange-600", label: "Marginal", bgColor: "bg-orange-100"}
        default:
            return {color: "text-red-600", label: "Poor", bgColor: "bg-red-100"}
    }
}

const getRatingDisplay = (rating: number | null) => {
    if (rating === null) return {color: "text-muted-foreground", label: "N/A", bgColor: "bg-muted"}

    switch (rating) {
        case 4:
            return {color: "text-green-600", label: "Good", bgColor: "bg-green-100"}
        case 3:
            return {color: "text-blue-600", label: "Acceptable", bgColor: "bg-blue-100"}
        case 2:
            return {color: "text-amber-600", label: "Marginal", bgColor: "bg-amber-100"}
        case 1:
            return {color: "text-red-600", label: "Poor", bgColor: "bg-red-100"}
        default:
            return {color: "text-muted-foreground", label: "Unknown", bgColor: "bg-muted"}
    }
}

// Function to format category names for display
const formatCategoryName = (categoryKey: string) => {
    return categoryKey
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

// Function to format element names for display
const formatElementName = (elementKey: string) => {
    return elementKey
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

export function CaseDetails({id}: CaseDetailsProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const [caseDetails, setCaseDetails] = useState<AssessmentRecord | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showOnlyObserved, setShowOnlyObserved] = useState(true)

    useEffect(() => {
        async function fetchCaseDetails() {
            try {
                setLoading(true)
                setError(null)
                // Use the records endpoint for detailed view
                const data = await apiClient.getRecordById(id)
                console.log(JSON.stringify(data))
                setCaseDetails(data)
            } catch (err) {
                console.error("Error fetching case details:", err)
                setError(err instanceof Error ? err.message : "Failed to load case details")
            } finally {
                setLoading(false)
            }
        }

        fetchCaseDetails()
    }, [id])

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <span className="ml-2">Loading case details...</span>
            </div>
        )
    }

    if (error || !caseDetails) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error || "Failed to load case details"}</AlertDescription>
            </Alert>
        )
    }

    // Parse the assessment results
    const {overall_assessment, rating_definitions, categories, transcript, audio_segments, score, maxScore} =
        parseAssessmentResults(caseDetails)

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="transcript">Transcript</TabsTrigger>
                        <TabsTrigger value="skills">Skills Breakdown</TabsTrigger>
                    </TabsList>
                    
                    {/* Assessment Information inline with tabs */}
                    <div className="hidden lg:block space-y-2">
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span>Lead:</span>
                                <span className="font-medium">{caseDetails.lead_surgeon}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Team:</span>
                                <span className="font-medium">{caseDetails.team_member_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Assessor:</span>
                                <span className="font-medium">{caseDetails.assessor_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Date:</span>
                                <span className="font-medium">{new Date(caseDetails.assessment_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {caseDetails.notes && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Notes:</span>
                                <span className="font-medium">{caseDetails.notes}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Assessment Information */}
                <div className="lg:hidden">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Lead Surgeon:</span>
                                    <p className="font-medium">{caseDetails.lead_surgeon}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Team Size:</span>
                                    <p className="font-medium">{caseDetails.team_member_count}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Assessor:</span>
                                    <p className="font-medium">{caseDetails.assessor_name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Date:</span>
                                    <p className="font-medium">{new Date(caseDetails.assessment_date).toLocaleDateString()}</p>
                                </div>
                                {caseDetails.notes && (
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Notes:</span>
                                        <p className="font-medium">{caseDetails.notes}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            <TabsContent value="overview" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Assessment Score</CardTitle>
                        <CardDescription>Overall performance evaluation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                            {overall_assessment ? (
                                <>
                                    {/* EVeNTs Format - Overall Rating */}
                                    <div className="flex items-center justify-center py-6">
                                        <div className="text-center">
                                            <div
                                                className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getRatingDisplay(overall_assessment.overall_rating).bgColor} mb-3`}
                                            >
                        <span
                            className={`text-3xl font-bold ${getRatingDisplayOverall(overall_assessment.overall_rating).color}`}
                        >
                          {overall_assessment.overall_rating || "N/A"}
                        </span>
                                            </div>
                                            <div
                                                className={`text-lg font-semibold ${getRatingDisplayOverall(overall_assessment.overall_rating).color}`}
                                            >
                                                {getRatingDisplayOverall(overall_assessment.overall_rating).label}
                                            </div>
                                            {rating_definitions && overall_assessment.overall_rating && (
                                                <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                                                    {rating_definitions[overall_assessment.overall_rating.toString()]}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category Breakdown - moved to top */}
                                    {categories && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold">Category Breakdown</h4>
                                            <div className="grid gap-3">
                                                {Object.entries(categories).map(([categoryKey, category]: [string, any]) => (
                                                    <div key={categoryKey} className="p-3 bg-muted/30 rounded-lg">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-sm font-medium">{formatCategoryName(categoryKey)}</span>
                                                            <div
                                                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getRatingDisplay(category.category_rating).bgColor}`}
                                                            >
                                                                <span className={`text-xs font-bold ${getRatingDisplay(category.category_rating).color}`}>
                                                                    {category.category_rating || "N/A"}
                                                                </span>
                                                            </div>
                                                            <Badge variant="outline" className={`text-xs ${getRatingDisplay(category.category_rating).color}`}>
                                                                {getRatingDisplay(category.category_rating).label}
                                                            </Badge>
                                                        </div>
                                                        {category.category_feedback_notes && (
                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                {category.category_feedback_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Overall Feedback */}
                                    {overall_assessment.overall_feedback && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">Overall Feedback</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {overall_assessment.overall_feedback}
                                            </p>
                                        </div>
                                    )}

                                    {/* Key Strengths */}
                                    {overall_assessment.key_strengths && overall_assessment.key_strengths.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-600"/>
                                                Key Strengths
                                            </h4>
                                            <ul className="space-y-1">
                                                {overall_assessment.key_strengths.map((strength: any, index: any) => (
                                                    <li key={index}
                                                        className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <CheckCircle2
                                                            className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0"/>
                                                        {strength}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Areas for Improvement */}
                                    {overall_assessment.areas_for_improvement && overall_assessment.areas_for_improvement.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Target className="h-4 w-4 text-amber-600"/>
                                                Areas for Improvement
                                            </h4>
                                            <ul className="space-y-1">
                                                {overall_assessment.areas_for_improvement.map((area: string, index: string) => (
                                                    <li key={index}
                                                        className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <CircleAlert
                                                            className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0"/>
                                                        {area}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Follow-up Information */}
                                    {overall_assessment.follow_up_required && (
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="h-4 w-4 text-blue-600"/>
                                                <span
                                                    className="text-sm font-semibold text-blue-900">Follow-up Required</span>
                                            </div>
                                            {overall_assessment.follow_up_date && (
                                                <p className="text-sm text-blue-700">
                                                    Scheduled
                                                    for: {new Date(overall_assessment.follow_up_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                </>
                            ) : score !== null ? (
                                <>
                                    {/* Legacy Format - Numerical Score */}
                                    <div className="flex items-center justify-center py-6">
                                        <div className="text-center">
                                            <div
                                                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
                        <span className="text-3xl font-bold text-primary">
                          {score}/{maxScore}
                        </span>
                                            </div>
                                            <div className="text-lg font-semibold text-primary">
                                                Score: {Math.round((score / maxScore) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <p className="text-muted-foreground">
                                            {caseDetails.status === "COMPLETED"
                                                ? "Assessment completed but no evaluation available"
                                                : "Assessment pending completion"}
                                        </p>
                                        {caseDetails.status === "TRANSCRIBING" && (
                                            <p className="text-sm text-muted-foreground mt-2">Processing audio and
                                                generating analysis...</p>
                                        )}
                                    </div>
                                </div>
                            )}
                    </CardContent>
                </Card>

                {/* Action Plan */}
                {overall_assessment?.action_plan && overall_assessment.action_plan.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Action Plan</CardTitle>
                            <CardDescription>Recommended next steps for improvement</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {overall_assessment.action_plan.map((action: string, index: string) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div
                                            className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-semibold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm">{action}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {caseDetails.error_message && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertTitle>Processing Error</AlertTitle>
                        <AlertDescription>{caseDetails.error_message}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>

            <TabsContent value="transcript" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Session Transcript</CardTitle>
                        <CardDescription>Recorded dialogue from the assessment session</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {audio_segments && audio_segments.length > 0 ? (
                            <div className="space-y-4 max-h-screen overflow-y-auto p-6">
                                {audio_segments.map((segment: AudioSegment, index: number) => {
                                    // Get speaker color based on speaker label
                                    const getSpeakerColor = (speaker: string) => {
                                        const colors = [
                                            'bg-blue-100 border-blue-300',
                                            'bg-green-100 border-green-300',
                                            'bg-purple-100 border-purple-300',
                                            'bg-orange-100 border-orange-300',
                                            'bg-pink-100 border-pink-300',
                                            'bg-cyan-100 border-cyan-300'
                                        ]
                                        // Generate consistent color based on speaker label
                                        const hash = speaker.split('').reduce((a, b) => {
                                            a = ((a << 5) - a) + b.charCodeAt(0)
                                            return a & a
                                        }, 0)
                                        return colors[Math.abs(hash) % colors.length]
                                    }

                                    const getSpeakerInitials = (speaker: string) => {
                                        return speaker.split(' ').map(word => word.charAt(0)).join('').toUpperCase()
                                    }

                                    const formatTime = (timeStr?: string) => {
                                        if (!timeStr) return ''
                                        // Assume format is HH:MM:SS or MM:SS
                                        return timeStr.replace(/^0+:/, '').replace(/^0/, '')
                                    }

                                    return (
                                        <div key={segment.id || index} className="flex gap-3 items-start">
                                            {/* Speaker Avatar */}
                                            <div
                                                className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                {getSpeakerInitials(segment.speaker_label)}
                                            </div>

                                            {/* Speech Bubble */}
                                            <div className="flex-1 max-w-[80%]">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="text-xs font-medium text-gray-600">{segment.speaker_label}</span>
                                                    {segment.start_time && (
                                                        <span
                                                            className="text-xs text-gray-400 font-mono">{formatTime(segment.start_time)}</span>
                                                    )}
                                                </div>
                                                <div
                                                    className={`p-3 rounded-xl border-2 ${getSpeakerColor(segment.speaker_label)}`}>
                                                    <p className="text-sm leading-relaxed text-gray-800">
                                                        {segment.transcript || 'No transcript available'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : transcript ? (
                            <div className="p-6">
                                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Raw transcript (audio segments not available)</span>
                                </div>
                                <div className="max-h-[calc(100vh-250px)] overflow-y-auto bg-muted/30 rounded-lg p-4">
                                    <pre className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 font-sans">
                                        {transcript}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div
                                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <MessageSquare className="w-8 h-8 text-gray-400"/>
                                </div>
                                <p className="text-gray-500 font-medium">
                                    {caseDetails.status === "COMPLETED"
                                        ? "No transcript available for this assessment"
                                        : "Transcript will be available once processing is complete"}
                                </p>
                                {caseDetails.status === "TRANSCRIBING" && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        <Loader2 className="w-4 h-4 animate-spin inline mr-2"/>
                                        Processing audio and generating transcript...
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Skills Assessment</CardTitle>
                                <CardDescription>Detailed breakdown of non-technical skills evaluation</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOnlyObserved(!showOnlyObserved)}
                                className="flex items-center gap-2"
                            >
                                {showOnlyObserved ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                                {showOnlyObserved ? "Show All" : "Show Observed Only"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {categories ? (
                            <div className="space-y-6">
                                {Object.entries(categories).map(([categoryKey, category]: [string, any]) => (
                                    <Card key={categoryKey} className="border-l-4 border-l-primary">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold">{formatCategoryName(categoryKey)}</h3>
                                                    <div
                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRatingDisplay(category.category_rating).bgColor}`}
                                                    >
                            <span className={`text-sm font-bold ${getRatingDisplay(category.category_rating).color}`}>
                              {category.category_rating || "N/A"}
                            </span>
                                                    </div>
                                                    <Badge variant="outline"
                                                           className={getRatingDisplay(category.category_rating).color}>
                                                        {getRatingDisplay(category.category_rating).label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {category.category_feedback_notes && (
                                                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-sm text-muted-foreground">{category.category_feedback_notes}</p>
                                                </div>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <Accordion type="multiple" className="w-full">
                                                {Object.entries(category.elements).map(([elementKey, element]: [string, any]) => (
                                                    <AccordionItem key={elementKey} value={elementKey}>
                                                        <AccordionTrigger className="hover:no-underline">
                                                            <div
                                                                className="flex items-center justify-between w-full pr-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span
                                                                        className="font-medium">{formatElementName(elementKey)}</span>
                                                                    <div
                                                                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getRatingDisplay(element.element_rating).bgColor}`}
                                                                    >
                                    <span
                                        className={`text-xs font-bold ${getRatingDisplay(element.element_rating).color}`}
                                    >
                                      {element.element_rating || "N/A"}
                                    </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="space-y-4 pt-2">
                                                                {/* Element Feedback */}
                                                                {element.feedback_notes && (
                                                                    <div
                                                                        className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <MessageSquare
                                                                                className="h-4 w-4 text-blue-600"/>
                                                                            <span
                                                                                className="text-sm font-semibold text-blue-900">Element Feedback</span>
                                                                        </div>
                                                                        <p className="text-sm text-blue-700">{element.feedback_notes}</p>
                                                                    </div>
                                                                )}

                                                                {/* Good Behaviors */}
                                                                {element.observed_behaviors?.good_behaviors &&
                                                                    element.observed_behaviors.good_behaviors.length > 0 && (
                                                                        <div>
                                                                            <h5 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                                                                <CheckCircle2 className="h-4 w-4"/>
                                                                                Good Behaviors
                                                                            </h5>
                                                                            <div className="space-y-2">
                                                                                {element.observed_behaviors.good_behaviors
                                                                                    .filter((behavior: any) => !showOnlyObserved || behavior.observed)
                                                                                    .map((behavior: any, index: number) => (
                                                                                        <div
                                                                                            key={behavior.behavior_code}
                                                                                            className={`p-3 rounded-lg border ${
                                                                                                behavior.observed
                                                                                                    ? "bg-green-50 border-green-200"
                                                                                                    : "bg-gray-50 border-gray-200"
                                                                                            }`}
                                                                                        >
                                                                                            <div
                                                                                                className="flex items-start gap-3">
                                                                                                <div
                                                                                                    className="flex items-center gap-2 min-w-0 flex-1">
                                                                                                    {behavior.observed ? (
                                                                                                        <CheckCircle2
                                                                                                            className="h-4 w-4 text-green-600 flex-shrink-0"/>
                                                                                                    ) : (
                                                                                                        <CircleX
                                                                                                            className="h-4 w-4 text-gray-400 flex-shrink-0"/>
                                                                                                    )}
                                                                                                    <div
                                                                                                        className="min-w-0 flex-1">
                                                                                                        <p
                                                                                                            className={`text-sm font-medium ${behavior.observed ? "text-green-900" : "text-gray-600"}`}
                                                                                                        >
                                                                                                            {behavior.description}
                                                                                                        </p>
                                                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                                                            Code: {behavior.behavior_code}
                                                                                                        </p>
                                                                                                        {behavior.notes && (
                                                                                                            <p
                                                                                                                className={`text-xs mt-2 ${behavior.observed ? "text-green-700" : "text-gray-500"}`}
                                                                                                            >
                                                                                                                {behavior.notes}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <Badge
                                                                                                    variant={behavior.observed ? "default" : "secondary"}
                                                                                                    className="text-xs"
                                                                                                >
                                                                                                    {behavior.observed ? "Observed" : "Not Observed"}
                                                                                                </Badge>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                {/* Poor Behaviors */}
                                                                {element.observed_behaviors?.poor_behaviors &&
                                                                    element.observed_behaviors.poor_behaviors.length > 0 && (
                                                                        <div>
                                                                            <h5 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                                                                                <CircleAlert className="h-4 w-4"/>
                                                                                Poor Behaviors
                                                                            </h5>
                                                                            <div className="space-y-2">
                                                                                {element.observed_behaviors.poor_behaviors
                                                                                    .filter((behavior: any) => !showOnlyObserved || behavior.observed)
                                                                                    .map((behavior: any, index: number) => (
                                                                                        <div
                                                                                            key={behavior.behavior_code}
                                                                                            className={`p-3 rounded-lg border ${
                                                                                                behavior.observed
                                                                                                    ? "bg-red-50 border-red-200"
                                                                                                    : "bg-gray-50 border-gray-200"
                                                                                            }`}
                                                                                        >
                                                                                            <div
                                                                                                className="flex items-start gap-3">
                                                                                                <div
                                                                                                    className="flex items-center gap-2 min-w-0 flex-1">
                                                                                                    {behavior.observed ? (
                                                                                                        <CircleAlert
                                                                                                            className="h-4 w-4 text-red-600 flex-shrink-0"/>
                                                                                                    ) : (
                                                                                                        <CheckCircle2
                                                                                                            className="h-4 w-4 text-gray-400 flex-shrink-0"/>
                                                                                                    )}
                                                                                                    <div
                                                                                                        className="min-w-0 flex-1">
                                                                                                        <p
                                                                                                            className={`text-sm font-medium ${behavior.observed ? "text-red-900" : "text-gray-600"}`}
                                                                                                        >
                                                                                                            {behavior.description}
                                                                                                        </p>
                                                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                                                            Code: {behavior.behavior_code}
                                                                                                        </p>
                                                                                                        {behavior.notes && (
                                                                                                            <p
                                                                                                                className={`text-xs mt-2 ${behavior.observed ? "text-red-700" : "text-gray-500"}`}
                                                                                                            >
                                                                                                                {behavior.notes}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <Badge
                                                                                                    variant={behavior.observed ? "destructive" : "secondary"}
                                                                                                    className="text-xs"
                                                                                                >
                                                                                                    {behavior.observed ? "Observed" : "Not Observed"}
                                                                                                </Badge>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground">
                                    {caseDetails.status === "COMPLETED"
                                        ? "No detailed skills assessment available for this case"
                                        : "Skills assessment will be available once processing is complete"}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
    )
}
