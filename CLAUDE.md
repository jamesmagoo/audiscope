# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Development commands:
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

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