/**
 * API client for interacting with our AWS backend services
 */

import { makeAuthenticatedRequest, getCurrentUserId, handleApiResponse } from './api-utils'

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
  id?: string
  uid?: string
  lead_surgeon: string
  team_member_count: number
  notes?: string
  assessor_name: string
  assessment_date: string
  staging_key?: string
  audio_file_id: string
  submission_date?: string
  status?: string
  created_at?: string
  updated_at?: string
  analysis?: any
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
  analysis: any
  error_message: string
  transcript_block: string
  audio_segments : AudioSegment[]
}

export interface AudioSegment {
  transcript? : string
  id: number
  speaker_label: string
  start_time?: string
  end_time?: string
}

// Response interface for list endpoints
export interface AssessmentListResponse {
  records: AssessmentRecord[]
  count: number
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

    const uid = await getCurrentUserId()
    const fullRequest = {
      ...fileDetails,
      uid,
    }

    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/uploads`, {
      method: "POST",
      body: JSON.stringify(fullRequest),
    })

    console.log("API response status:", response.status)
    const data = await handleApiResponse(response)
    
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
    const uid = await getCurrentUserId()
    const request = {
      ...assessmentData,
      uid,
    }

    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/assessments`, {
      method: "POST",
      body: JSON.stringify(request),
    })

    const data = await handleApiResponse(response)
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

  try {
    const uid = await getCurrentUserId()
    const url = new URL(`${API_BASE_URL}/records`)
    
    if (status && status !== "all") {
      url.searchParams.append("status", status)
    }
    url.searchParams.append("uid", uid)

    const response = await makeAuthenticatedRequest(url.toString())
    return await handleApiResponse(response)
  } catch (error) {
    console.error("Error getting records:", error)
    throw error
  }
}


/**
 * Get a specific assessment by ID
 */
export async function getAssessmentById(id: string): Promise<AssessmentRecord> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/assessments/${id}`)
    return await handleApiResponse(response)
  } catch (error) {
    console.error("Error getting assessment:", error)
    throw error
  }
}

/**
 * Get a specific record by ID from /records endpoint
 */
export async function getRecordById(id: string): Promise<AssessmentRecord> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const uid = await getCurrentUserId()
    const url = new URL(`${API_BASE_URL}/records/${id}`)
    url.searchParams.append("uid", uid)

    const response = await makeAuthenticatedRequest(url.toString())
    return await handleApiResponse(response)
  } catch (error) {
    console.error("Error getting record:", error)
    throw error
  }
}

/**
 * Complete API client for our backend
 */
const apiClient = {
  submitAssessment,
  getUploadUrl,
  getRecords,
  getAssessmentById,
  getRecordById,
}

export default apiClient
