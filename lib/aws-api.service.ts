/**
 * API client for interacting with our AWS backend services
 */

// Replace with your actual API endpoint after deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL

if (!API_BASE_URL) {
  console.warn("NEXT_PUBLIC_API_GATEWAY_URL environment variable is not set")
}

// Types
export interface FileUploadRequest {
  filename: string
  fileType: string
  fileSize: number
}

export interface FileUploadResponse {
  uploadUrl: string
  fileId: string
  key: string
}

// Assessment types
export interface AssessmentData {
  id?: string // Optional for creation, present after submission
  uid?: string // Will be added automatically
  lead_surgeon: string
  team_member_count: number
  notes?: string
  assessor_name: string
  assessment_date: string
  staging_key?: string // Will be set during upload
  audio_file_id: string
  submission_date?: string // Will be set automatically
  status?: string // e.g., "TRANSCRIBING", "COMPLETED", "PENDING"
  created_at?: string
  updated_at?: string
  analysis?: string
  error_message?: string
  transcript_block?: string
}

// Full assessment record (what we get back from API)
export interface AssessmentRecord {
  id: string
  uid: string
  lead_surgeon: string
  team_member_count: number
  notes?: string
  assessor_name: string
  assessment_date: string
  staging_key: string
  audio_file_id: string
  submission_date: string
  status: string
  created_at: string
  updated_at: string
  analysis: string
  error_message: string
  transcript_block: string
}

// Response interface for list endpoints
export interface AssessmentListResponse {
  records: AssessmentRecord[]
  count: number
}

function getUserID(): string {
  // In a real app, this would come from authentication
  return "abcdef123456"
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function getUploadUrl(fileDetails: FileUploadRequest): Promise<FileUploadResponse> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    console.log("Requesting presigned URL for:", fileDetails.filename)

    const fullRequest = {
      ...fileDetails,
      uid: getUserID(),
    }

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fullRequest),
    })

    console.log("API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || `API Error: ${response.status}`)
      } catch (jsonError) {
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`)
      }
    }

    const data = await response.json()
    console.log("Received presigned URL successfully")
    return data
  } catch (error) {
    console.error("Error getting presigned URL:", error)
    throw error
  }
}

export async function submitAssessment(
  assessmentData: AssessmentData,
): Promise<{ success: boolean; id: string; message?: string }> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const request = {
      ...assessmentData,
      uid: getUserID(),
    }

    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || `API Error: ${response.status}`)
      } catch (jsonError) {
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`)
      }
    }

    const data = await response.json()
    return {
      success: true,
      id: data.id || data.assessmentId || "",
      message: data.message || "Assessment submitted successfully",
    }
  } catch (error) {
    console.error("Error submitting assessment:", error)
    throw error
  }
}

/**
 * Get all assessment records from /records endpoint, optionally filtered by status
 */
export async function getRecords(status?: string): Promise<AssessmentListResponse> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  const url = new URL(`${API_BASE_URL}/records`)
  if (status && status !== "all") {
    url.searchParams.append("status", status)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to get records")
  }

  return response.json()
}

/**
 * Get all assessments for the current user from /assessments endpoint
 */
export async function getAssessments(status?: string): Promise<AssessmentListResponse> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  const url = new URL(`${API_BASE_URL}/assessments`)
  if (status && status !== "all") {
    url.searchParams.append("status", status)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to get assessments")
  }

  return response.json()
}

/**
 * Get a specific assessment by ID
 */
export async function getAssessmentById(id: string): Promise<AssessmentRecord> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  const response = await fetch(`${API_BASE_URL}/assessments/${id}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to get assessment")
  }

  return response.json()
}

/**
 * Get a specific record by ID from /records endpoint
 */
export async function getRecordById(id: string): Promise<AssessmentRecord> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  const url = new URL(`${API_BASE_URL}/records`)
  url.searchParams.append("fileId", id)

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to get record")
  }

  return response.json()
}

/**
 * Complete API client for our backend
 */
const apiClient = {
  submitAssessment,
  getUploadUrl,
  getRecords,
  getAssessments,
  getAssessmentById,
  getRecordById,
}

export default apiClient
