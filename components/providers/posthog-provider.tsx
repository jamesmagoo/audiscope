"use client"

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useAuth } from './auth-provider'

/**
 * PostHog Analytics Provider
 *
 * Features:
 * - Production-only tracking
 * - EU data residency
 * - Automatic user identification via AWS Cognito
 * - Feature flags support
 * - Performance monitoring
 * - Page view auto-capture
 *
 * Note: User identification is handled separately in PostHogIdentifier component
 * to ensure proper initialization order.
 */
export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
    const isProduction = process.env.NODE_ENV === 'production'

    // Only initialize PostHog in production environment
    if (posthogKey && posthogHost && isProduction) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only', // Only create profiles for identified users

        // Auto-capture settings
        capture_pageview: true, // Automatic page view tracking
        capture_pageleave: true, // Track when users leave pages

        // Performance monitoring
        capture_performance: true, // Enable web vitals tracking

        // Session recording - disabled per user preference
        disable_session_recording: true,

        // Feature flags
        bootstrap: {
          featureFlags: {},
        },

        // Privacy settings
        property_blacklist: ['$password', '$credit_card'], // Don't capture sensitive fields

        // Advanced options
        autocapture: true, // Auto-capture clicks, form submissions, etc.
        capture_dead_clicks: true, // Track frustration signals

        // Enable for debugging in production (optional)
        // loaded: (posthog) => {
        //   posthog.debug()
        // },
      })

      console.log('[PostHog] Initialized in production mode with EU instance')
    } else if (!isProduction) {
      console.log('[PostHog] Disabled in non-production environment')
    } else {
      console.warn('[PostHog] Missing configuration:', {
        hasKey: !!posthogKey,
        hasHost: !!posthogHost,
      })
    }
  }, []) // Empty dependency array - only run once on mount

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

/**
 * User Identification Component
 *
 * Identifies users to PostHog when authentication state changes.
 * Should be placed inside AuthProvider context.
 */
export function PostHogIdentifier() {
  const { user } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction) return

    if (user?.attributes?.userId) {
      // Identify user with AWS Cognito user ID
      posthog.identify(user.attributes.userId, {
        email: user.email,
        username: user.username,
      })

      console.log('[PostHog] User identified:', user.attributes.userId)
    } else {
      // Reset PostHog identity on logout
      posthog.reset()
      console.log('[PostHog] User identity reset')
    }
  }, [user])

  return null
}
