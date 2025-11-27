# GEMINI.md - AudiScope / Landy.ai Project Context

This document provides a comprehensive overview of the AudiScope (internally `landy.ai`) project for AI agents and developers. It details the project structure, key technologies, development conventions, and current roadmap.

## 1. Project Overview

**Name:** AudiScope (Package name: `landy.ai`)
**Purpose:** A medical training and product management platform. It primarily functions as a "medical training audio assessor" (AudiScope) allowing users to upload, transcribe, and analyze surgical assessments. It is also expanding to include a Product Management system for medical devices.
**Core Functionality:**
- **Dashboard:** Analytics on assessments (Total, Pending, Completed).
- **Audio Assessment:** Upload audio files, request transcriptions, and view analysis (speech-to-text pipeline).
- **Product Management:** Create and manage medical device product entries with associated file uploads (IFU, images, videos) using S3 presigned URLs.
- **Authentication:** Integrated with AWS Cognito via AWS Amplify.

## 2. Key Technologies

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (`.ts`, `.tsx`)
- **Styling:** Tailwind CSS, `shadcn/ui` (Radix UI primitives + Lucide icons)
- **State Management:** `@tanstack/react-query` (Server State), React Hooks (Local State)
- **Forms:** `react-hook-form` + `zod` validation
- **Data Visualization:** `recharts`
- **Authentication:** AWS Amplify (`aws-amplify`)
- **Backend Integration:** Custom API Gateway (likely Go-based backend for "Core API").

## 3. Architecture & Directory Structure

The project follows standard Next.js App Router conventions.

- **`app/`**: Application routes and pages.
  - `page.tsx`: Landing page.
  - `dashboard/`: Protected application area (Stats, Upload, Cases, Products).
  - `api/`: Next.js API routes (limited use, mostly proxies or specific backend tasks).
- **`components/`**: React components.
  - `ui/`: Reusable `shadcn/ui` components (Button, Card, Input, etc.).
  - `dashboard/`, `cases/`, `products/`: Feature-specific components.
- **`lib/`**: Utilities and Service layer.
  - `audio-pipeline-api.service.ts`: API client for Audio Assessment features.
  - `product.service.ts`: API client for Product Management features.
  - `auth-config.ts`: AWS Amplify configuration.
  - `utils.ts`: General helper functions (cn, formatting).
- **`hooks/`**: Custom React hooks (e.g., `use-products.ts`, `use-toast.ts`).
- **`public/`**: Static assets.

## 4. Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- npm, yarn, or pnpm

### Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check
npm run typecheck
```

## 5. Development Conventions

- **API Interaction:** Do not make `fetch` calls directly in components. Use the service layer in `lib/` (e.g., `apiClient`, `coreApiClient`) or custom hooks in `hooks/` (e.g., `useProducts`).
- **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files unless absolutely necessary. Use `cn()` utility for class merging.
- **Components:**
  - Prefer functional components.
  - Use `shadcn/ui` components from `components/ui/` for consistent design.
  - break down complex pages into smaller components.
- **Async Data:** Use `react-query` for data fetching, caching, and mutations.
- **Forms:** Use `react-hook-form` with `zod` schemas for complex forms.
- **Types:** Define TypeScript interfaces for all data structures (usually found in service files or `types.ts`).

## 6. Roadmap & Current Focus

**Current Focus:** Implementing Product Creation and File Upload functionality.
- **Reference:** See `PRODUCT_CREATION_IMPLEMENTATION_PLAN.md` for detailed specs.
- **Goal:** Allow users to create "Products" (medical devices) and upload associated documentation/media to S3 via presigned URLs.
- **Key Files to Watch:**
  - `lib/product.service.ts` (or `core-api.service.ts`)
  - `hooks/use-products.ts`
  - `app/dashboard/products/create/page.tsx`

**Future:**
- Enhanced Product Detail Pages.
- Advanced Analytics for Audio Assessments.
- Integration with "Core API" backend services.
