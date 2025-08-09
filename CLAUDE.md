# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Development commands:
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

## Architecture Overview

AudiScope is a Next.js 15 medical training application for evaluating clinical team performance through AI-powered audio analysis of medical procedures (EndoVascular Non-Technical Skills - EVeNTs).

### Key Architecture Components

**Frontend Stack:**
- Next.js 15.2.4 with App Router architecture
- React 19 with TypeScript
- Tailwind CSS + shadcn/ui component library
- React Hook Form + Zod for form validation

**Backend Integration:**
- AWS API Gateway backend (`lib/aws-api.service.ts`)
- AWS Amplify Authentication (`components/auth-provider.tsx`)
- S3 for audio file storage with presigned URLs
- Environment variable: `NEXT_PUBLIC_API_GATEWAY_URL`

**Core Data Flow:**
1. Users upload audio files through the upload interface
2. Files are uploaded to S3 via presigned URLs
3. Assessment metadata is submitted to AWS API Gateway
4. Backend processes audio with AI analysis
5. Results are displayed in the dashboard

### Directory Structure

- `app/` - Next.js App Router pages with nested routing
  - `dashboard/` - Main application dashboard with sidebar layout (protected by AuthGuard)
  - `dashboard/cases/[id]/` - Dynamic case detail pages
  - `dashboard/upload/` - Assessment upload functionality
  - `login/` - User authentication login page
  - `signup/` - User registration and email confirmation
  - `forgot-password/` - Password reset functionality
  - `reset-password/` - Password reset confirmation
- `components/` - Reusable React components organized by feature
  - `ui/` - shadcn/ui component library
  - `cases/` - Case management components
  - `upload/` - File upload components
  - `auth-provider.tsx` - AWS Amplify authentication context provider
  - `auth-guard.tsx` - Route protection component for authenticated pages
- `lib/aws-api.service.ts` - AWS backend API client with TypeScript interfaces
- `lib/auth-config.ts` - AWS Amplify authentication configuration
- `hooks/` - Custom React hooks

### Key Files

- `lib/aws-api.service.ts` - Backend API integration with JWT-authenticated requests
- `lib/api-utils.ts` - JWT authentication utilities and request helpers
- `components/auth-provider.tsx` - AWS Amplify authentication with JWT token management
- `app/dashboard/layout.tsx` - Dashboard layout with sidebar navigation
- `components/ui/` - shadcn/ui components (managed via `components.json`)

### Development Notes

- Uses pnpm as package manager
- Built with v0.dev integration (auto-synced from v0.dev deployments)
- Deployed on Vercel
- No testing framework currently configured
- TypeScript strict mode enabled

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_API_GATEWAY_URL=your-aws-api-gateway-url
```

### AWS Configuration

This application requires:
- AWS API Gateway endpoint for backend communication
- S3 bucket access for audio file storage (configured through backend)
- Proper CORS settings for presigned URL uploads

### First-time Setup

1. Install dependencies: `pnpm install`
2. Set up environment variables in `.env.local`
3. Start development server: `pnpm dev`
4. Verify API connectivity through the upload functionality

## Code Quality & Development Tools

### Available Scripts for Code Quality
- `pnpm lint` - ESLint for code quality and consistency
- `pnpm typecheck` - TypeScript type checking without compilation
- `pnpm build` - Production build (includes type checking)

### Recommended Development Setup
- Install ESLint extension in your editor for real-time linting
- Enable TypeScript strict mode checking in your editor
- Consider setting up Prettier for consistent code formatting

### Pre-commit Recommendations
While not currently configured, consider adding:
- Husky for git hooks
- lint-staged for running linters on staged files
- Prettier for automatic code formatting

## Development Workflow

### Common Development Tasks
1. **Adding new components**: Follow existing patterns in `components/` directory
2. **Creating new pages**: Use Next.js App Router structure in `app/` directory
3. **Styling**: Use Tailwind CSS classes and shadcn/ui components
4. **Forms**: Use React Hook Form with Zod validation (see existing patterns)

### Debugging
- Use React DevTools for component debugging
- Check browser Network tab for API request/response debugging
- Console logs are preserved in development mode

### Troubleshooting
- **Build errors**: Run `pnpm typecheck` to identify TypeScript issues
- **Lint errors**: Run `pnpm lint` to see ESLint warnings/errors
- **API connectivity**: Verify `NEXT_PUBLIC_API_GATEWAY_URL` in `.env.local`
- **Upload issues**: Check browser console for S3 presigned URL errors

## API Documentation

### AWS API Service (`lib/aws-api.service.ts`)

The main API client handles all backend communication with AWS services using JWT-based authentication.

#### Authentication & Authorization

All API calls now include JWT authorization tokens in the `Authorization: Bearer <token>` header format. The system automatically:
- Extracts JWT tokens from AWS Amplify sessions using `fetchAuthSession()`
- Includes real user IDs from JWT token payload (sub claim) instead of hardcoded values
- Handles token refresh automatically on 401/403 errors
- Provides centralized error handling for authentication failures

#### Key Functions

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

#### Core Types

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

### API Authentication Utilities (`lib/api-utils.ts`)

**Single source of truth** for JWT-based authentication helpers and secure API communication.

#### Key Functions

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

#### Architecture Notes

- **Primary JWT Module**: Contains all JWT token extraction and management logic
- **Used by AuthProvider**: AuthProvider imports these functions rather than duplicating them
- **Used by API Service**: All API functions use these utilities for authentication
- **No Duplication**: Eliminates code duplication and ensures consistency

#### Features

- **Automatic Token Refresh**: Retries requests with fresh tokens on 401/403 errors
- **Error Handling**: Centralized API error processing with proper error types
- **JWT Extraction**: Safely extracts tokens and user information from Amplify sessions
- **Request Wrapper**: Simplifies authenticated API calls with consistent header injection

#### Usage Examples

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

## Authentication System

AudiScope uses AWS Amplify Authentication for secure user management with email-based signup/signin.

### Authentication Architecture

**Components:**
- `components/auth-provider.tsx` - React Context provider for authentication state
- `components/auth-guard.tsx` - Route protection wrapper component  
- `lib/auth-config.ts` - AWS Amplify configuration
- `app/layout.tsx` - Root layout wrapped with AuthProvider
- `app/dashboard/layout.tsx` - Dashboard layout wrapped with AuthGuard

**Authentication Flow:**
1. User visits protected route (dashboard)
2. AuthGuard checks authentication status via AuthProvider
3. Unauthenticated users redirected to `/login`
4. After successful login, users can access protected routes

### Authentication Pages

**Login Page (`app/login/page.tsx`):**
- Email/password authentication
- Form validation with error handling
- Success message display from URL params (post-signup confirmation)
- AudiScope branding

**Signup Page (`app/signup/page.tsx`):**
- Two-step process: registration → email confirmation
- Password strength validation
- Email confirmation with 6-digit code
- Auto-redirect to login after successful confirmation
- Resend confirmation code functionality

**Password Reset:**
- `app/forgot-password/page.tsx` - Password reset initiation
- `app/reset-password/page.tsx` - Password reset confirmation

### AuthProvider Functions

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInUser: (username: string, password: string) => Promise<void>
  signUpUser: (username: string, password: string, email: string) => Promise<void>
  signOutUser: () => Promise<void>
  confirmSignUpUser: (username: string, code: string) => Promise<void>
  resendConfirmationCode: (username: string) => Promise<void>
  forgotPassword: (username: string) => Promise<void>
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>
  // JWT-related functions
  getAuthHeaders: () => Promise<Record<string, string>>
  getUserId: () => Promise<string | null>
}
```

#### JWT Authentication Features

The AuthProvider provides JWT functionality by importing from `lib/api-utils.ts`:

- **No Code Duplication**: Imports `getAuthHeaders()` and `getCurrentUserId()` from api-utils
- **Interface Wrapper**: `getUserId()` wraps `getCurrentUserId()` to return `null` on errors (maintains backward compatibility)
- **Clean Architecture**: Focuses on auth state management rather than duplicating JWT logic
- **Single Source of Truth**: All JWT operations centralized in api-utils module

### User Interface Integration

**Landing Page (`app/page.tsx`):**
- Conditional navigation: "Sign In" for unauthenticated, "Dashboard" for authenticated users
- Dynamic CTA buttons based on auth state

**Dashboard Sidebar (`components/dashboard/app-sidebar.tsx`):**
- Real user email and username display
- Smart initial generation from email
- Text truncation for long usernames/emails
- Styled logout button with hover effects
- Professional user avatar with gradient background

### Route Protection

```typescript
// Dashboard protection example
<AuthGuard>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>{children}</SidebarInset>
  </SidebarProvider>
</AuthGuard>
```

### Development Notes

- Authentication state persists across browser sessions
- Loading states handled during auth operations
- Error handling with user-friendly messages
- Automatic redirects maintain smooth user experience
- All authentication pages use consistent AudiScope branding
- **JWT Integration**: All API calls automatically include authentication headers
- **Token Management**: Transparent token refresh on expiration
- **Security**: Real user context from JWT payload instead of hardcoded values
- **Clean Architecture**: JWT utilities centralized in `lib/api-utils.ts` with no code duplication
- **Separation of Concerns**: AuthProvider focuses on state management, api-utils handles JWT operations