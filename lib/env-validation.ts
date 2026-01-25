/**
 * Environment variable validation
 * Ensures all required environment variables are set at startup
 */

const requiredServerEnvVars = [
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_CLIENT_ID',
  'KEYCLOAK_CLIENT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
] as const

const requiredClientEnvVars = [
  'NEXT_PUBLIC_KEYCLOAK_URL',
  'NEXT_PUBLIC_KEYCLOAK_REALM',
  'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
] as const

/**
 * Validate server-side environment variables
 * Call this in next.config.js or at app startup
 */
export function validateServerEnv() {
  const missing: string[] = []

  for (const key of requiredServerEnvVars) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    )
  }
}

/**
 * Validate client-side environment variables
 * Call this in a client component that runs early (like root layout)
 */
export function validateClientEnv() {
  const missing: string[] = []

  for (const key of requiredClientEnvVars) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing required client environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    )
  }
}

// Run server validation immediately if in server context
if (typeof window === 'undefined') {
  validateServerEnv()
}
