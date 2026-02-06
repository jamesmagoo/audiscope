# API Documentation

## AWS API Service (`lib/aws-api.service.ts`)

The main API client handles all backend communication with AWS services using JWT-based authentication.

### Authentication & Authorization

All API calls now include JWT authorization tokens in the `Authorization: Bearer <token>` header format. The system automatically:
- Extracts JWT tokens from AWS Amplify sessions using `fetchAuthSession()`
- Includes real user IDs from JWT token payload (sub claim) instead of hardcoded values
- Handles token refresh automatically on 401/403 errors
- Provides centralized error handling for authentication failures

### Key Functions

**File Upload**
```typescript
getUploadUrl(fileDetails: FileUploadRequest): Promise<FileUploadResponse>
```
- Generates presigned S3 URLs for audio file uploads
- **Authentication**: Requires valid JWT token
- **User Context**: Automatically includes authenticated user's ID
- Returns: `{ uploadUrl, fileId, key }`

**Assessment Management**
```typescript
submitAssessment(assessmentData: AssessmentData): Promise<{ success: boolean; id: string }>
getAssessments(status?: string): Promise<AssessmentListResponse>
getAssessmentById(id: string): Promise<AssessmentRecord>
```
- **Authentication**: All functions require valid JWT token
- **User Context**: Automatically scoped to authenticated user

**Record Management**
```typescript
getRecords(status?: string): Promise<AssessmentListResponse>
getRecordById(id: string): Promise<AssessmentRecord>
```
- **Authentication**: Requires valid JWT token
- **User Context**: Includes authenticated user's ID in query parameters

### Core Types

```typescript
// Assessment submission data
interface AssessmentData {
  lead_surgeon: string
  team_member_count: number
  notes?: string
  assessor_name: string
  assessment_date: string
  audio_file_id: string
}

// Complete assessment record from API
interface AssessmentRecord {
  id: string
  uid: string
  status: string
  analysis: string
  transcript_block: string
  // ... plus all AssessmentData fields
}
```

## API Authentication Utilities (`lib/api-utils.ts`)

**Single source of truth** for JWT-based authentication helpers and secure API communication.

### Key Functions

```typescript
// Get authenticated headers with JWT token
getAuthHeaders(): Promise<Record<string, string>>

// Get current user ID from JWT token payload (throws on error)
getCurrentUserId(): Promise<string>

// Make authenticated request with automatic token refresh
makeAuthenticatedRequest(url: string, options?: RequestInit): Promise<Response>

// Handle API response errors
handleApiResponse(response: Response): Promise<any>
```

### Architecture Notes

- **Primary JWT Module**: Contains all JWT token extraction and management logic
- **Used by AuthProvider**: AuthProvider imports these functions rather than duplicating them
- **Used by API Service**: All API functions use these utilities for authentication
- **No Duplication**: Eliminates code duplication and ensures consistency

### Features

- **Automatic Token Refresh**: Retries requests with fresh tokens on 401/403 errors
- **Error Handling**: Centralized API error processing with proper error types
- **JWT Extraction**: Safely extracts tokens and user information from Amplify sessions
- **Request Wrapper**: Simplifies authenticated API calls with consistent header injection

### Usage Examples

```typescript
// Upload audio file (now with JWT authentication)
const uploadResponse = await getUploadUrl({
  filename: 'recording.mp3',
  fileType: 'audio/mp3',
  fileSize: 1024000
})

// Submit assessment (now with real user ID from JWT)
const result = await submitAssessment({
  lead_surgeon: 'Dr. Smith',
  team_member_count: 4,
  assessor_name: 'Jane Doe',
  assessment_date: '2024-01-15',
  audio_file_id: uploadResponse.fileId
})
```
