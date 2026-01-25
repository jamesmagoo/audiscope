import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Keycloak SSO Logout Endpoint
 *
 * This endpoint handles full single sign-out by:
 * 1. Getting the current session
 * 2. Redirecting to Keycloak's logout endpoint with id_token_hint
 * 3. Keycloak will end the SSO session and redirect back
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (session) {
    const idToken = (session as any).idToken
    const postLogoutRedirectUri = encodeURIComponent(
      process.env.NEXTAUTH_URL + "/"
    )

    // Redirect to Keycloak's logout endpoint
    const keycloakLogoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutRedirectUri}`

    return NextResponse.redirect(keycloakLogoutUrl)
  }

  // No session, just redirect to home
  return NextResponse.redirect(process.env.NEXTAUTH_URL!)
}
