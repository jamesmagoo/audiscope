# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Development commands:
- `pnpm dev` - Start development server with cloud resources (.env.dev-cloud)
- `pnpm local` - Start development server with LocalStack (.env.development)
- `pnpm staging` - Start development server with staging environment (.env.staging)
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
- TanStack React Query v5 for server state management

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
  - `providers/` - React context providers
    - `auth-provider.tsx` - AWS Amplify authentication context provider
    - `query-provider.tsx` - TanStack React Query client provider
    - `theme-provider.tsx` - Theme context provider
  - `auth-guard.tsx` - Route protection component for authenticated pages
- `lib/aws-api.service.ts` - AWS backend API client with TypeScript interfaces
- `lib/auth-config.ts` - AWS Amplify authentication configuration
- `hooks/` - Custom React hooks

### Key Files

- `lib/aws-api.service.ts` - Backend API integration with JWT-authenticated requests
- `lib/api-utils.ts` - JWT authentication utilities and request helpers
- `components/providers/auth-provider.tsx` - AWS Amplify authentication with JWT token management
- `components/providers/query-provider.tsx` - TanStack React Query client configuration
- `app/dashboard/layout.tsx` - Dashboard layout with sidebar navigation
- `components/ui/` - shadcn/ui components (managed via `components.json`)

### Development Notes

- Uses pnpm as package manager
- Built with v0.dev integration (auto-synced from v0.dev deployments)
- Deployed on Vercel
- No testing framework currently configured
- TypeScript strict mode enabled

## Environment Setup

AudiScope supports multiple environment configurations for different development and deployment scenarios.

### Environment Profiles

The project includes four environment configuration files:

1. **`.env.dev-cloud`** - Development with all real AWS resources (recommended)
2. **`.env.development`** - Local development with LocalStack (S3 emulation)
3. **`.env.staging`** - Staging environment configuration
4. **`.env.example`** - Template with all available environment variables

### Quick Start

**For Development with All Cloud Resources (Recommended):**

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server (uses .env.dev-cloud automatically)
pnpm dev
```

This configuration uses:
- Real AWS Cognito for authentication
- Real AWS API Gateway for audio assessments
- Real Core API on AWS ALB (dev environment)
- Real AWS S3 for file storage
- Real AWS Bedrock Knowledge Base

**For Local Development with LocalStack:**

```bash
# 1. Install dependencies
pnpm install

# 2. Install and start LocalStack (for local S3 testing)
pip install localstack
localstack start

# 3. Start your backend service (Core API on http://localhost:5002)
# (Use your backend's start command)

# 4. Start development server (uses .env.development automatically)
pnpm local
```

### Required Environment Variables

#### AWS Cognito Authentication
```bash
NEXT_PUBLIC_AWS_REGION=eu-west-1
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
```

#### Backend APIs (Dual Backend Architecture)

**Backend 1: AWS API Gateway (Audio Assessment Pipeline)**
```bash
# Deployed AWS service for audio transcription and analysis
NEXT_PUBLIC_API_GATEWAY_URL=https://your-gateway.execute-api.region.amazonaws.com
```

**Backend 2: Core API (Product Management)**
```bash
# Local development
NEXT_PUBLIC_API_URL=http://localhost:5002
NEXT_PUBLIC_CORE_API_URL=http://localhost:5002/api

# Production/Staging
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_CORE_API_URL=https://api.example.com/api
```

#### AWS Bedrock Knowledge Base
```bash
NEXT_PUBLIC_KNOWLEDGE_BASE_ID=your-knowledge-base-id
```

#### S3 Configuration (LocalStack Support)
```bash
# Optional: Enable LocalStack for local S3 testing
# When set, uses LocalStack instead of real AWS S3
NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE=http://localhost:4566

# For real AWS S3: Leave this unset or remove it
```

#### Sentry (Optional)
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### LocalStack Setup (Local S3 Emulation)

LocalStack allows you to test S3 file uploads locally without using AWS resources:

```bash
# Install LocalStack
pip install localstack

# Start LocalStack
localstack start

# Verify it's running
aws --endpoint-url=http://localhost:4566 s3 ls

# In .env.local, set:
NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE=http://localhost:4566
```

**Features:**
- No AWS costs during development
- Faster iteration (no network latency)
- Works offline
- Automatic URL transformation in `lib/product-files.service.ts`

**Switching to Real AWS S3:**
1. Comment out or remove `NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE` from `.env.local`
2. Ensure your backend is configured with real S3 bucket names
3. Restart the development server

### AWS Configuration

This application requires the following AWS services:

**Deployed Services (Already Configured):**
- **AWS Cognito** - User authentication and JWT tokens
- **AWS API Gateway** - Audio assessment pipeline (Lambda backend)
- **AWS Bedrock** - Knowledge base for AI-powered document search

**Backend-Managed Services:**
- **AWS S3** - File storage (accessed via presigned URLs from backend)
  - Staging bucket for temporary uploads
  - Main bucket for processed files
  - CORS configuration for browser uploads
  - Lifecycle policies for automatic cleanup

**CORS Requirements:**
All S3 buckets must be configured to allow:
- PUT requests from your frontend domain
- Appropriate headers for file uploads
- Presigned URL authentication

### Environment Switching

Environment switching is now handled automatically via npm scripts:

**Dev-Cloud (All Cloud Resources):**
```bash
pnpm dev
```

**LocalStack (Local Development):**
```bash
pnpm local
```

**Staging Environment:**
```bash
pnpm staging
```

No need to manually copy `.env` files - each command uses its corresponding environment file automatically.

**Verify Current Environment:**
Check your browser console on app load. The application logs will show:
- Which API endpoints are being used
- Whether LocalStack URL transformation is active
- Authentication status

### Troubleshooting

**"API endpoint not configured" error:**
- Check that `NEXT_PUBLIC_API_GATEWAY_URL` is set in `.env.local`
- Restart the development server after changing environment variables

**File upload fails:**
- If using LocalStack: Ensure LocalStack is running (`localstack status`)
- If using AWS S3: Check backend is generating valid presigned URLs
- Verify CORS configuration on S3 buckets
- Check browser console for detailed error messages

**Authentication errors (401/403):**
- Verify Cognito credentials in `.env.local`
- Check that user pool and client ID are correct
- Clear browser localStorage and try logging in again

**Backend connection errors:**
- Core API: Ensure backend is running on expected port (default: 5002)
- API Gateway: Verify the endpoint URL is correct and accessible
- Check network tab in browser DevTools for failed requests

### First-time Setup Checklist

- [ ] Install dependencies: `pnpm install`
- [ ] Choose your environment and run the corresponding command:
  - `pnpm dev` - All cloud resources (recommended)
  - `pnpm local` - LocalStack with local backend
  - `pnpm staging` - Staging environment
- [ ] If using LocalStack (`pnpm local`): Install and start LocalStack first
- [ ] If using dev-cloud (`pnpm dev`): Verify backend ALB is accessible
- [ ] Test authentication (login/signup)
- [ ] Verify file upload functionality
- [ ] Check browser console for any errors

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
\`\`\`typescript
getUploadUrl(fileDetails: FileUploadRequest): Promise<FileUploadResponse>
\`\`\`
- Generates presigned S3 URLs for audio file uploads
- **Authentication**: Requires valid JWT token
- **User Context**: Automatically includes authenticated user's ID
- Returns: `{ uploadUrl, fileId, key }`

**Assessment Management**
\`\`\`typescript
submitAssessment(assessmentData: AssessmentData): Promise<{ success: boolean; id: string }>
getAssessments(status?: string): Promise<AssessmentListResponse>
getAssessmentById(id: string): Promise<AssessmentRecord>
\`\`\`
- **Authentication**: All functions require valid JWT token
- **User Context**: Automatically scoped to authenticated user

**Record Management**
\`\`\`typescript
getRecords(status?: string): Promise<AssessmentListResponse>
getRecordById(id: string): Promise<AssessmentRecord>
\`\`\`
- **Authentication**: Requires valid JWT token
- **User Context**: Includes authenticated user's ID in query parameters

#### Core Types

\`\`\`typescript
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
\`\`\`

### API Authentication Utilities (`lib/api-utils.ts`)

**Single source of truth** for JWT-based authentication helpers and secure API communication.

#### Key Functions

\`\`\`typescript
// Get authenticated headers with JWT token
getAuthHeaders(): Promise<Record<string, string>>

// Get current user ID from JWT token payload (throws on error)
getCurrentUserId(): Promise<string>

// Make authenticated request with automatic token refresh
makeAuthenticatedRequest(url: string, options?: RequestInit): Promise<Response>

// Handle API response errors
handleApiResponse(response: Response): Promise<any>
\`\`\`

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

\`\`\`typescript
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
\`\`\`

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

\`\`\`typescript
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
\`\`\`

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

\`\`\`typescript
// Dashboard protection example
<AuthGuard>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>{children}</SidebarInset>
  </SidebarProvider>
</AuthGuard>
\`\`\`

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

## Data Management with React Query

AudiScope uses TanStack React Query v5 for efficient server state management, caching, and synchronization.

### React Query Architecture

**Provider Setup:**
- `components/providers/query-provider.tsx` - QueryClient configuration and provider
- `app/layout.tsx` - Root layout wrapped with QueryProvider
- React Query DevTools enabled in development (top-right corner)

**Provider Hierarchy:**
\`\`\`typescript
<QueryProvider>
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
  <ReactQueryDevtools initialIsOpen={false} buttonPosition={'top-right'}/>
</QueryProvider>
\`\`\`

### QueryClient Configuration

The QueryClient is configured with default settings in `components/providers/query-provider.tsx`:

\`\`\`typescript
const [queryClient] = useState(() => new QueryClient());
\`\`\`

### Development Tools

**React Query DevTools:**
- Available in development mode only
- Positioned at top-right of screen
- Provides real-time query state inspection
- Shows cached data, loading states, and refetch controls
- Helps debug query behavior and performance

### Integration with Authentication

React Query works seamlessly with the JWT authentication system:
- Queries automatically include authentication headers via `lib/api-utils.ts`
- Failed authentication (401/403) triggers automatic token refresh
- Query invalidation on authentication state changes
- Cached data respects user context and permissions

### Recommended Query Patterns

**Query Keys:**
Use consistent, hierarchical query keys that include user context:
\`\`\`typescript
const queryKey = ['assessments', userId, { status }];
const queryKey = ['assessment', assessmentId, userId];
\`\`\`

**Mutations:**
Combine mutations with optimistic updates and query invalidation:
\`\`\`typescript
const mutation = useMutation({
  mutationFn: submitAssessment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['assessments'] });
  }
});
\`\`\`

**Error Handling:**
Leverage React Query's built-in error handling with authentication:
\`\`\`typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['assessments'],
  queryFn: () => getAssessments(),
  retry: (failureCount, error) => {
    // Don't retry auth errors
    if (error.status === 401 || error.status === 403) return false;
    return failureCount < 3;
  }
});
\`\`\`

### Performance Benefits

- **Automatic Caching**: Reduces redundant API calls
- **Background Updates**: Keeps data fresh without blocking UI
- **Request Deduplication**: Multiple identical requests are batched
- **Optimistic Updates**: Immediate UI feedback for mutations
- **Infinite Queries**: Efficient pagination for large datasets
- **Prefetching**: Anticipate user navigation and data needs
