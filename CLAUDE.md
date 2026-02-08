# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Development commands:
- `bun dev` - Start development server with cloud resources (.env.dev-cloud)
- `bun local` - Start development server with LocalStack (.env.development)
- `bun staging` - Start development server with staging environment (.env.staging)
- `bun run build` - Build for production
- `bun start` - Start production server
- `bun lint` - Run ESLint
- `bun typecheck` - Run TypeScript type checking

Note: Use `bun run build` (not `bun build`) because `bun build` is Bun's bundler command.

## Architecture Overview

Landy is a Next.js 15 medical training application for evaluating clinical team performance through AI-powered audio analysis of medical procedures (EndoVascular Non-Technical Skills - EVeNTs).

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
  - `simulation/` - Voice recording and AI conversation components
    - `voice-recorder.tsx` - MediaRecorder-based audio capture with 3D flip card UI
    - `audio-waveform.tsx` - Real-time frequency visualization
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

- Uses bun as package manager
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
bun install

# 2. Start development server (uses .env.dev-cloud automatically)
bun dev
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
bun install

# 2. Install and start LocalStack (for local S3 testing)
pip install localstack
localstack start

# 3. Start your backend service (Core API on http://localhost:5002)
# (Use your backend's start command)

# 4. Start development server (uses .env.development automatically)
bun local
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
bun dev
```

**LocalStack (Local Development):**
```bash
bun local
```

**Staging Environment:**
```bash
bun staging
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

- [ ] Install dependencies: `bun install`
- [ ] Choose your environment and run the corresponding command:
  - `bun dev` - All cloud resources (recommended)
  - `bun local` - LocalStack with local backend
  - `bun staging` - Staging environment
- [ ] If using LocalStack (`bun local`): Install and start LocalStack first
- [ ] If using dev-cloud (`bun dev`): Verify backend ALB is accessible
- [ ] Test authentication (login/signup)
- [ ] Verify file upload functionality
- [ ] Check browser console for any errors

## Additional Documentation

For detailed information on specific topics, see the following documentation:

- **[Code Quality & Development Tools](docs/code-quality.md)** - ESLint, TypeScript, development workflow, and debugging
- **[API Documentation](docs/api-documentation.md)** - AWS API service, JWT authentication utilities, and usage examples
- **[Authentication System](docs/authentication.md)** - AWS Amplify authentication, login/signup flows, and route protection
- **[Data Management with React Query](docs/react-query.md)** - TanStack React Query setup, patterns, and performance optimization
- **[WebSocket Architecture](docs/websocket-architecture.md)** - Simple WebSocket hook, connection lifecycle, and Core-API protocol
- **[Audio Transcoding Requirements](docs/audio-transcoding-requirements.md)** - Backend requirements for audio format conversion to OGG/Opus
