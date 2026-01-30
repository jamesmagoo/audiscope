'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

/**
 * Enhanced Page View Tracker
 *
 * Supplements PostHog's automatic page view tracking with:
 * - URL parameters
 * - Previous page tracking
 * - Custom properties based on route
 *
 * Note: PostHog already captures page views automatically via capture_pageview: true,
 * but this component adds enhanced metadata.
 */
export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    // Only track in production
    if (process.env.NODE_ENV !== 'production') return
    if (!pathname) return

    // Get previous path from session storage
    const previousPath = sessionStorage.getItem('currentPath') || undefined

    // Extract route metadata
    const routeMetadata = getRouteMetadata(pathname)

    // Track enhanced page view
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path: pathname,
      search: searchParams.toString(),
      previousPath,
      ...routeMetadata,
    })

    // Store current path for next navigation
    sessionStorage.setItem('currentPath', pathname)
  }, [pathname, searchParams, posthog])

  return null
}

/**
 * Extract metadata from route patterns
 */
function getRouteMetadata(pathname: string): Record<string, any> {
  const metadata: Record<string, any> = {}

  // Dashboard pages
  if (pathname.startsWith('/dashboard')) {
    metadata.section = 'dashboard'

    // Specific dashboard sections
    if (pathname.includes('/products')) {
      metadata.subsection = 'products'
      // Check for product detail page
      const productIdMatch = pathname.match(/\/products\/([^/]+)/)
      if (productIdMatch && productIdMatch[1] !== 'create') {
        metadata.pageType = 'product_detail'
        metadata.productId = productIdMatch[1]
      } else if (pathname.includes('/create')) {
        metadata.pageType = 'product_create'
      } else {
        metadata.pageType = 'product_list'
      }
    } else if (pathname.includes('/learning')) {
      metadata.subsection = 'learning'
      // Check for quiz pages
      if (pathname.includes('/quiz/')) {
        const quizIdMatch = pathname.match(/\/quiz\/([^/]+)/)
        if (quizIdMatch) {
          metadata.quizId = quizIdMatch[1]
          if (pathname.includes('/take')) {
            metadata.pageType = 'quiz_taking'
          } else if (pathname.includes('/results')) {
            metadata.pageType = 'quiz_results'
          }
        }
      } else {
        metadata.pageType = 'learning_hub'
      }
    } else if (pathname.includes('/assistant')) {
      metadata.subsection = 'assistant'
      metadata.pageType = 'ai_chat'
    } else if (pathname.includes('/content')) {
      metadata.subsection = 'content'
      const contentIdMatch = pathname.match(/\/content\/([^/]+)/)
      if (contentIdMatch) {
        metadata.pageType = 'content_detail'
        metadata.contentId = contentIdMatch[1]
      } else {
        metadata.pageType = 'content_list'
      }
    } else if (pathname.includes('/upload')) {
      metadata.subsection = 'upload'
      metadata.pageType = 'assessment_upload'
    } else if (pathname.includes('/simulation')) {
      metadata.subsection = 'simulation'
      metadata.pageType = 'ai_simulation'
    } else {
      metadata.pageType = 'dashboard_home'
    }
  }
  // Auth pages
  else if (pathname === '/login') {
    metadata.section = 'auth'
    metadata.pageType = 'login'
  } else if (pathname === '/signup') {
    metadata.section = 'auth'
    metadata.pageType = 'signup'
  } else if (pathname === '/forgot-password') {
    metadata.section = 'auth'
    metadata.pageType = 'password_reset'
  }
  // Landing page
  else if (pathname === '/') {
    metadata.section = 'marketing'
    metadata.pageType = 'landing'
  }

  return metadata
}
