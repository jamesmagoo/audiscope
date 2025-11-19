# GEMINI.md - AudiScope Project Overview

This document provides an overview of the AudiScope project, intended for use as instructional context for AI interactions.

## Project Overview

AudiScope is a Next.js (React) web application built with TypeScript, serving as a "medical training audio assessor." The project leverages `v0.dev` for rapid development and is deployed on Vercel. It integrates with AWS Amplify, suggesting a robust backend infrastructure for authentication and potentially other services.

## Key Technologies

*   **Framework:** Next.js (React)
*   **Language:** TypeScript, JavaScript
*   **Styling & UI Components:** Tailwind CSS for styling, Radix UI for accessible and customizable UI components.
*   **State Management & Data Fetching:** Utilizes `@tanstack/react-query` for server state management and `react-hook-form` for form handling.
*   **Authentication:** `aws-amplify` is used, indicating integration with AWS Amplify for authentication services.
*   **Charting:** `recharts` for data visualization.
*   **Icons:** `lucide-react` provides a comprehensive icon set.
*   **Markdown Rendering:** `react-markdown` is used for rendering markdown content.

## Building and Running

The project includes standard Next.js scripts for development, building, and starting the application.

*   **Development:** To start the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
*   **Building for Production:** To build the application for production deployment:
    ```bash
    npm run build
    # or
    yarn build
    # or
    pnpm build
    ```
*   **Starting Production Server:** To start the production server after building:
    ```bash
    npm run start
    # or
    yarn start
    # or
    pnpm start
    ```
*   **Linting:** To run ESLint for code quality checks:
    ```bash
    npm run lint
    # or
    yarn lint
    # or
    pnpm lint
    ```
*   **Type Checking:** To perform TypeScript type checking without emitting JavaScript:
    ```bash
    npm run typecheck
    # or
    yarn typecheck
    # or
    pnpm typecheck
    ```

## Development Conventions

The project follows typical Next.js and TypeScript conventions. Components are likely structured within the `components/` directory, with application pages in `app/`. Utility functions and API service integrations can be found in the `lib/` directory. Given the use of Radix UI and Tailwind CSS, component styling and accessibility are likely key considerations. The presence of `aws-amplify` suggests an emphasis on secure and scalable cloud-based solutions.
