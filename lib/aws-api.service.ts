import { getAuthHeaders, getCurrentUserId } from "./api-utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL

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
}

export interface AssessmentListResponse {
  records: AssessmentRecord[]
  count: number
}

export async function getUploadUrl(fileDetails: FileUploadRequest): Promise<FileUploadResponse> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const uid = await getCurrentUserId()
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...fileDetails, uid }),
    })

    if (!response.ok) {
      throw new Error(`Upload URL request failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting upload URL:", error)
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
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...assessmentData, uid }),
    })

    if (!response.ok) {
      throw new Error(`Assessment submission failed: ${response.status}`)
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

export async function getRecords(status?: string): Promise<AssessmentListResponse> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const uid = await getCurrentUserId()
    const headers = await getAuthHeaders()
    const url = new URL(`${API_BASE_URL}/records`)

    if (status && status !== "all") {
      url.searchParams.append("status", status)
    }
    url.searchParams.append("uid", uid)

    const response = await fetch(url.toString(), {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Get records failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting records:", error)
    throw error
  }
}

export async function getAssessmentById(id: string): Promise<AssessmentRecord> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/assessments/${id}`, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Get assessment failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting assessment:", error)
    throw error
  }
}

export async function getRecordById(id: string): Promise<AssessmentRecord> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint not configured")
  }

  try {
    const uid = await getCurrentUserId()
    const headers = await getAuthHeaders()
    const url = new URL(`${API_BASE_URL}/records/${id}`)
    url.searchParams.append("uid", uid)

    const response = await fetch(url.toString(), {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Get record failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting record:", error)
    throw error
  }
}

export default {
  getUploadUrl,
  submitAssessment,
  getRecords,
  getAssessmentById,
  getRecordById,
}

export const apiClient = {
  getUploadUrl,
  submitAssessment,
  getRecords,
  getAssessmentById,
  getRecordById,
}
