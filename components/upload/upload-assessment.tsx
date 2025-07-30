"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { FileAudio, Check, AlertCircle } from "lucide-react"
import apiClient, { type FileUploadResponse, type AssessmentData } from "@/lib/aws-api.service"
import { useToast } from "@/hooks/use-toast"

// Define the validation schema with Zod
const formSchema = z.object({
  lead_surgeon: z.string().min(1, { message: "Lead surgeon name is required" }),
  team_member_count: z
    .number()
    .min(1, { message: "Number of team members is required" })
    .max(30, { message: "Max speakers which can be processed is 30" }),
  notes: z.string().optional(),
  assessor_name: z.string().min(1, { message: "Assessor name is required" }),
  assessment_date: z.string().min(1, { message: "Assessment date is required" }),
  isAudioUploaded: z.boolean().refine((val) => val === true, {
    message: "Audio upload is required",
  }),
})

// Define types for our form
type FormValues = z.infer<typeof formSchema>

export function UploadAssessment() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isAudioUploaded, setIsAudioUploaded] = useState<boolean>(false)
  const [fileId, setFileId] = useState<string | null>(null)
  const [stagingKey, setStagingKey] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const { toast } = useToast()

  // Initialize the form with useForm hook and zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_surgeon: "",
      team_member_count: 1,
      notes: "",
      assessor_name: "",
      assessment_date: new Date().toISOString().split("T")[0],
      isAudioUploaded: false,
    },
  })

  const handleAudioUploadComplete = (res: FileUploadResponse, fileName: string): void => {
    setIsAudioUploaded(true)
    setFileId(res.fileId)
    setStagingKey(res.key)
    setUploadedFileName(fileName)
    form.setValue("isAudioUploaded", true)
  }

  const onSubmit = async (data: FormValues): Promise<void> => {
    setIsSubmitting(true)

    try {
      console.log("Form submitted:", data)

      // Make sure we have a fileId
      if (!fileId || !stagingKey) {
        throw new Error("No audio file has been uploaded")
      }

      // Prepare submission data
      const submissionData: AssessmentData = {
        ...data,
        audio_file_id: fileId,
        submission_date: new Date().toISOString(),
        staging_key: stagingKey,
      }

      // Submit to API
      const response = await apiClient.submitAssessment(submissionData)

      console.log("API response:", response)

      // Show success toast
      toast({
        variant: "success",
        title: "Assessment Submitted Successfully!",
        description: "Your assessment has been submitted and is now being processed.",
      })

      // Mark as successfully submitted
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive", 
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An error occurred while submitting the assessment. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    form.reset()
    setIsAudioUploaded(false)
    setFileId(null)
    setStagingKey(null)
    setIsSubmitted(false)
    setUploadedFileName(null)
  }

  // AudioUpload component
  const AudioUpload = () => {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState<boolean>(false)
    const [progress, setProgress] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFileType = (file: File): boolean => {
      const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a", "audio/x-m4a"]
      return validTypes.includes(file.type)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0]
        if (validateFileType(selectedFile)) {
          setFile(selectedFile)
          setError(null)
        } else {
          setError("Invalid file type. Please upload an audio file.")
          setFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      }
    }

    const handleUpload = async () => {
      if (!file) {
        setError("Please select a file first")
        return
      }

      try {
        setUploading(true)
        setProgress(0)
        setError(null)

        // Get presigned URL from API
        const uploadRequest = {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
        }

        const presignedData = await apiClient.getUploadUrl(uploadRequest)

        // Upload file to S3 using XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100)
              setProgress(percentComplete)
            }
          })

          // Handle successful upload
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress(100)
              resolve()
            } else {
              reject(new Error(`Upload failed with status: ${xhr.status}`))
            }
          })

          // Handle network errors
          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'))
          })

          // Handle timeouts
          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timed out'))
          })

          // Configure request
          xhr.open('PUT', presignedData.uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.timeout = 300000 // 5 minutes timeout for large files

          // Start upload
          xhr.send(file)
        })

        // Only set success after upload completes successfully
        setSuccess(true)
        handleAudioUploadComplete(presignedData, file.name)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to upload file. Please try again.")
        console.error("Upload error:", error)
      } finally {
        setUploading(false)
      }
    }

    return (
      <FormField
        control={form.control}
        name="isAudioUploaded"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="audio">Audio Recording</Label>
            <div className="mt-1">
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                <FileAudio className="h-10 w-10 text-muted-foreground mb-2" />
                {!isAudioUploaded && (
                <div className="space-y-1 text-center">
                  <p className="text-sm text-muted-foreground">Upload an audio recording of the surgical procedure</p>
                  <div className="flex justify-center text-sm">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      disabled={uploading || (success && isAudioUploaded)}
                    >
                      Upload a file
                    </button>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="audio/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      disabled={uploading || (success && isAudioUploaded)}
                    />
                    <p className="pl-1 text-muted-foreground">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">MP3, WAV, M4A up to 500MB</p>
                </div>)}

                {file && !success && !isAudioUploaded && (
                  <div className="mt-4 w-full">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    {uploading ? (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Uploading...</span>
                          <span>{progress}%</span>
                        </div>
                      </div>
                    ) : (
                      <Button type="button" className="mt-2 w-full" onClick={handleUpload}>
                        Upload Audio
                      </Button>
                    )}
                  </div>
                )}

                {(success || isAudioUploaded) && (
                  <div className="mt-4 w-full">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center text-green-700 flex-1 min-w-0">
                          <Check className="h-5 w-5 mr-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">File uploaded successfully</p>
                            <p className="text-sm text-green-600 truncate">{file?.name || uploadedFileName || "Audio file"}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setFile(null)
                            setSuccess(false)
                            setIsAudioUploaded(false)
                            setFileId(null)
                            setStagingKey(null)
                            setUploadedFileName(null)
                            form.setValue("isAudioUploaded", false)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          className="ml-3 text-xs text-muted-foreground hover:text-green-700 transition-colors underline-offset-4 hover:underline"
                        >
                          Replace
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 text-red-500 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </div>
                )}
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Surgical Team Assessment</CardTitle>
        <CardDescription>Evaluate non-technical skills based on simulation recordings</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            {/* Lead Surgeon */}
            <FormField
              control={form.control}
              name="lead_surgeon"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="lead_surgeon">Lead Surgeon</Label>
                  <FormControl>
                    <Input id="lead_surgeon" placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Member Count */}
            <FormField
              control={form.control}
              name="team_member_count"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="team_member_count">Number of Speakers</Label>
                  <FormControl>
                    <Input
                      id="team_member_count"
                      type="number"
                      min="1"
                      max="30"
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="notes">Notes</Label>
                  <FormControl>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about the simulation session or team performance"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audio Upload */}
            <AudioUpload />

            {/* Assessor Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessor_name"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="assessor_name">Assessor Name</Label>
                    <FormControl>
                      <Input id="assessor_name" placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessment_date"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="assessment_date">Assessment Date</Label>
                    <FormControl>
                      <Input id="assessment_date" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </CardContent>

          <CardFooter className="flex gap-4">
            {isSubmitted ? (
              <>
                <div className="flex-1 p-3 bg-green-50 border border-green-200 w-full rounded-lg">
                  <div className="flex items-center text-green-700">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="font-medium">Assessment submitted successfully!</span>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Submit Another
                </Button>
              </>
            ) : (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
