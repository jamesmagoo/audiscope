/**
 * PostHog Analytics Event Names
 *
 * Centralized constants for all analytics events to ensure consistency
 * and avoid typos. Organized by feature domain.
 */

// =============================================================================
// AUTHENTICATION EVENTS
// =============================================================================

export const AUTH_EVENTS = {
  // User lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_EMAIL_CONFIRMED: 'user_email_confirmed',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_PASSWORD_RESET_INITIATED: 'user_password_reset_initiated',
  USER_PASSWORD_RESET_COMPLETED: 'user_password_reset_completed',

  // Auth errors
  LOGIN_FAILED: 'login_failed',
  SIGNUP_FAILED: 'signup_failed',
  EMAIL_CONFIRMATION_FAILED: 'email_confirmation_failed',
} as const

// =============================================================================
// QUIZ / LEARNING EVENTS
// =============================================================================

export const QUIZ_EVENTS = {
  // Quiz lifecycle
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_ABANDONED: 'quiz_abandoned',

  // Question interactions
  QUIZ_QUESTION_VIEWED: 'quiz_question_viewed',
  QUIZ_QUESTION_ANSWERED: 'quiz_question_answered',
  QUIZ_QUESTION_SKIPPED: 'quiz_question_skipped',

  // Results
  QUIZ_RESULTS_VIEWED: 'quiz_results_viewed',
  QUIZ_RETAKEN: 'quiz_retaken',
  QUIZ_PREVIOUS_ATTEMPT_REVIEWED: 'quiz_previous_attempt_reviewed',

  // Learning hub
  LEARNING_HUB_VIEWED: 'learning_hub_viewed',
  QUIZ_SELECTED: 'quiz_selected',
} as const

// =============================================================================
// CHAT / AI ASSISTANT EVENTS
// =============================================================================

export const CHAT_EVENTS = {
  // Session management
  CHAT_SESSION_STARTED: 'chat_session_started',
  CHAT_SESSION_ENDED: 'chat_session_ended',
  CONVERSATION_CREATED: 'conversation_created',
  CONVERSATION_SELECTED: 'conversation_selected',

  // Message interactions
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_WITH_FILE_SENT: 'message_with_file_sent',

  // Feedback
  MESSAGE_COPIED: 'message_copied',
  MESSAGE_RATED: 'message_rated',
} as const

// =============================================================================
// CONTENT GENERATION EVENTS
// =============================================================================

export const CONTENT_EVENTS = {
  // Generation lifecycle
  CONTENT_GENERATION_INITIATED: 'content_generation_initiated',
  CONTENT_GENERATION_COMPLETED: 'content_generation_completed',
  CONTENT_GENERATION_FAILED: 'content_generation_failed',

  // Content management
  CONTENT_VIEWED: 'content_viewed',
  CONTENT_EDITED: 'content_edited',
  CONTENT_PUBLISHED: 'content_published',
  CONTENT_DELETED: 'content_deleted',

  // Content list
  CONTENT_LIST_VIEWED: 'content_list_viewed',
  CONTENT_LIST_FILTERED: 'content_list_filtered',
} as const

// =============================================================================
// ASSESSMENT UPLOAD EVENTS
// =============================================================================

export const UPLOAD_EVENTS = {
  // Upload lifecycle
  UPLOAD_STARTED: 'upload_started',
  UPLOAD_PROGRESS: 'upload_progress',
  UPLOAD_COMPLETED: 'upload_completed',
  UPLOAD_FAILED: 'upload_failed',

  // Assessment submission
  ASSESSMENT_SUBMITTED: 'assessment_submitted',
  ASSESSMENT_VIEWED: 'assessment_viewed',
  ASSESSMENT_ANALYSIS_VIEWED: 'assessment_analysis_viewed',
} as const

// =============================================================================
// PRODUCT EVENTS
// =============================================================================

export const PRODUCT_EVENTS = {
  // Product lifecycle
  PRODUCT_CREATED: 'product_created',
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_EDITED: 'product_edited',
  PRODUCT_DELETED: 'product_deleted',

  // Product list
  PRODUCT_LIST_VIEWED: 'product_list_viewed',
  PRODUCT_SELECTED: 'product_selected',

  // Product interactions
  PRODUCT_FILES_VIEWED: 'product_files_viewed',
  PRODUCT_FILE_UPLOADED: 'product_file_uploaded',
  PRODUCT_FILE_DELETED: 'product_file_deleted',
  PRODUCT_CHAT_STARTED: 'product_chat_started',
} as const

// =============================================================================
// NAVIGATION EVENTS
// =============================================================================

export const NAVIGATION_EVENTS = {
  // Sidebar navigation
  SIDEBAR_NAVIGATION_CLICKED: 'sidebar_navigation_clicked',
  SIDEBAR_TOGGLED: 'sidebar_toggled',

  // Landing page
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
  LANDING_FEATURE_VIEWED: 'landing_feature_viewed',

  // Breadcrumbs
  BREADCRUMB_CLICKED: 'breadcrumb_clicked',
} as const

// =============================================================================
// SIMULATION EVENTS
// =============================================================================

export const SIMULATION_EVENTS = {
  // Simulation lifecycle
  SIMULATION_STARTED: 'simulation_started',
  SIMULATION_COMPLETED: 'simulation_completed',
  SIMULATION_ABANDONED: 'simulation_abandoned',

  // Interactions
  SIMULATION_MESSAGE_SENT: 'simulation_message_sent',
  SIMULATION_MESSAGE_RECEIVED: 'simulation_message_received',
  SIMULATION_PAUSED: 'simulation_paused',
  SIMULATION_RESUMED: 'simulation_resumed',

  // Results
  SIMULATION_RESULTS_VIEWED: 'simulation_results_viewed',
  SIMULATION_FEEDBACK_VIEWED: 'simulation_feedback_viewed',
} as const

// =============================================================================
// ERROR EVENTS
// =============================================================================

export const ERROR_EVENTS = {
  API_ERROR: 'api_error',
  FORM_VALIDATION_ERROR: 'form_validation_error',
  FILE_UPLOAD_ERROR: 'file_upload_error',
  WEBSOCKET_ERROR: 'websocket_error',
  GENERIC_ERROR: 'generic_error',
} as const

// =============================================================================
// PERFORMANCE EVENTS
// =============================================================================

export const PERFORMANCE_EVENTS = {
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  LARGE_FILE_UPLOAD_TIME: 'large_file_upload_time',
} as const

// =============================================================================
// HELPER: ALL EVENTS
// =============================================================================

export const ALL_EVENTS = {
  ...AUTH_EVENTS,
  ...QUIZ_EVENTS,
  ...CHAT_EVENTS,
  ...CONTENT_EVENTS,
  ...UPLOAD_EVENTS,
  ...PRODUCT_EVENTS,
  ...NAVIGATION_EVENTS,
  ...SIMULATION_EVENTS,
  ...ERROR_EVENTS,
  ...PERFORMANCE_EVENTS,
} as const

// Type for all event names
export type PostHogEventName = (typeof ALL_EVENTS)[keyof typeof ALL_EVENTS]
