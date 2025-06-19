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
  - `dashboard/` - Main application dashboard with sidebar layout
  - `dashboard/cases/[id]/` - Dynamic case detail pages
  - `dashboard/upload/` - Assessment upload functionality
- `components/` - Reusable React components organized by feature
  - `ui/` - shadcn/ui component library
  - `cases/` - Case management components
  - `upload/` - File upload components
- `lib/aws-api.service.ts` - AWS backend API client with TypeScript interfaces
- `hooks/` - Custom React hooks

### Key Files

- `lib/aws-api.service.ts` - Backend API integration with assessment and file upload types
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

The main API client handles all backend communication with AWS services.

#### Key Functions

**File Upload**
```typescript
getUploadUrl(fileDetails: FileUploadRequest): Promise<FileUploadResponse>
```
- Generates presigned S3 URLs for audio file uploads
- Returns: `{ uploadUrl, fileId, key }`

**Assessment Management**
```typescript
submitAssessment(assessmentData: AssessmentData): Promise<{ success: boolean; id: string }>
getAssessments(status?: string): Promise<AssessmentListResponse>
getAssessmentById(id: string): Promise<AssessmentRecord>
```

**Record Management**
```typescript
getRecords(status?: string): Promise<AssessmentListResponse>
getRecordById(id: string): Promise<AssessmentRecord>
```

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

#### Usage Examples

```typescript
// Upload audio file
const uploadResponse = await getUploadUrl({
  filename: 'recording.mp3',
  fileType: 'audio/mp3',
  fileSize: 1024000
})

// Submit assessment
const result = await submitAssessment({
  lead_surgeon: 'Dr. Smith',
  team_member_count: 4,
  assessor_name: 'Jane Doe',
  assessment_date: '2024-01-15',
  audio_file_id: uploadResponse.fileId
})
```