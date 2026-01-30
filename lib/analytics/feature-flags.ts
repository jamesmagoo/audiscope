/**
 * PostHog Feature Flags Utilities
 *
 * Helpers and React hooks for working with PostHog feature flags.
 * Provides type-safe access to feature flags throughout the application.
 */

import { usePostHog, useFeatureFlagEnabled } from 'posthog-js/react'

// =============================================================================
// FEATURE FLAG KEYS
// =============================================================================

/**
 * Define all feature flags used in the application.
 * Keep this list updated as new flags are added in PostHog.
 */
export const FEATURE_FLAGS = {
  // Example feature flags (update with your actual flags)
  NEW_CHAT_UI: 'new-chat-ui',
  ADVANCED_QUIZ_MODE: 'advanced-quiz-mode',
  SIMULATION_V2: 'simulation-v2',
  CONTENT_GENERATION_V2: 'content-generation-v2',
  BULK_UPLOAD: 'bulk-upload',
  TEAM_COLLABORATION: 'team-collaboration',
  ANALYTICS_DASHBOARD: 'analytics-dashboard',
  BETA_FEATURES: 'beta-features',
} as const

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook to check if a feature flag is enabled
 *
 * @param flagKey - The feature flag key
 * @returns boolean indicating if the flag is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isNewChatUIEnabled = useFeatureFlag(FEATURE_FLAGS.NEW_CHAT_UI)
 *
 *   return isNewChatUIEnabled ? <NewChatUI /> : <OldChatUI />
 * }
 * ```
 */
export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  // Only check flags in production
  if (process.env.NODE_ENV !== 'production') {
    return false
  }

  return useFeatureFlagEnabled(flagKey)
}

/**
 * Hook to get the feature flag payload/value
 *
 * @param flagKey - The feature flag key
 * @returns The flag payload or undefined
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const chatConfig = useFeatureFlagPayload(FEATURE_FLAGS.NEW_CHAT_UI)
 *
 *   return <Chat maxMessages={chatConfig?.maxMessages || 50} />
 * }
 * ```
 */
export function useFeatureFlagPayload<T = any>(flagKey: FeatureFlagKey): T | undefined {
  const posthog = usePostHog()

  // Only check flags in production
  if (process.env.NODE_ENV !== 'production') {
    return undefined
  }

  return posthog.getFeatureFlagPayload(flagKey) as T | undefined
}

/**
 * Hook to get all active feature flags for the current user
 *
 * @returns Object with all active feature flags
 *
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const flags = useAllFeatureFlags()
 *
 *   return (
 *     <div>
 *       <h3>Active Feature Flags:</h3>
 *       <pre>{JSON.stringify(flags, null, 2)}</pre>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAllFeatureFlags(): Record<string, boolean | string> {
  const posthog = usePostHog()

  // Only check flags in production
  if (process.env.NODE_ENV !== 'production') {
    return {}
  }

  return posthog.getFeatureFlags() || {}
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a feature flag is enabled (non-React contexts)
 *
 * @param posthog - PostHog instance
 * @param flagKey - The feature flag key
 * @returns boolean indicating if the flag is enabled
 *
 * @example
 * ```ts
 * import posthog from 'posthog-js'
 *
 * if (isFeatureFlagEnabled(posthog, FEATURE_FLAGS.NEW_CHAT_UI)) {
 *   // Do something
 * }
 * ```
 */
export function isFeatureFlagEnabled(
  posthog: any,
  flagKey: FeatureFlagKey
): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false
  }

  return posthog.isFeatureEnabled(flagKey) || false
}

/**
 * Get feature flag payload (non-React contexts)
 *
 * @param posthog - PostHog instance
 * @param flagKey - The feature flag key
 * @returns The flag payload or undefined
 */
export function getFeatureFlagPayload<T = any>(
  posthog: any,
  flagKey: FeatureFlagKey
): T | undefined {
  if (process.env.NODE_ENV !== 'production') {
    return undefined
  }

  return posthog.getFeatureFlagPayload(flagKey) as T | undefined
}

// =============================================================================
// FEATURE FLAG CONFIGURATIONS
// =============================================================================

/**
 * Type definitions for feature flag payloads
 * Update these as you add new flags with complex payloads
 */
export interface FeatureFlagPayloads {
  [FEATURE_FLAGS.NEW_CHAT_UI]: {
    maxMessages?: number
    enableVoiceInput?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
  [FEATURE_FLAGS.ADVANCED_QUIZ_MODE]: {
    enableHints?: boolean
    allowSkip?: boolean
    timeLimit?: number
  }
  [FEATURE_FLAGS.SIMULATION_V2]: {
    enableAdvancedScenarios?: boolean
    maxSimulationTime?: number
  }
}

/**
 * Typed hook to get feature flag payload with proper typing
 *
 * @example
 * ```tsx
 * const chatConfig = useTypedFeatureFlagPayload(FEATURE_FLAGS.NEW_CHAT_UI)
 * // chatConfig is properly typed as FeatureFlagPayloads[typeof FEATURE_FLAGS.NEW_CHAT_UI]
 * ```
 */
export function useTypedFeatureFlagPayload<K extends keyof FeatureFlagPayloads>(
  flagKey: K
): FeatureFlagPayloads[K] | undefined {
  return useFeatureFlagPayload<FeatureFlagPayloads[K]>(flagKey)
}
