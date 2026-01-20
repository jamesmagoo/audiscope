import { NextAuthOptions, TokenSet } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: any): Promise<any> {
  try {
    console.log("Attempting to refresh access token...")
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }),
      }
    )

    const refreshedTokens: TokenSet = await response.json()

    if (!response.ok) {
      console.error("Token refresh failed:", refreshedTokens)
      throw refreshedTokens
    }

    console.log("Token refreshed successfully")
    const expiresIn = typeof refreshedTokens.expires_in === 'number' ? refreshedTokens.expires_in : 300
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      idToken: refreshedTokens.id_token ?? token.idToken,
      error: undefined,
    }
  } catch (error) {
    console.error("Error refreshing access token:", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  // Enable dynamic subdomain handling for multi-tenant setup
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours (not on every request)
  },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      // Initial sign in - account is only present during signin
      if (account && user && profile) {
        const expiresAt = account.expires_at as number
        console.log("=== INITIAL SIGN IN ===")
        console.log("expires_at:", expiresAt, "current time:", Math.floor(Date.now() / 1000), "diff:", expiresAt - Math.floor(Date.now() / 1000), "seconds")
        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: expiresAt,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          userId: profile.sub || user.id,
          // Extract roles from Keycloak token
          roles: (profile as any).roles || (profile as any).realm_access?.roles || [],
          // Extract organisation_id from custom user attributes
          organisationId: (profile as any).organisation_id,
          user,
          error: undefined,
        }
      }

      // Subsequent calls - account is undefined
      // If there's already an error, don't try to refresh
      if (token.error) {
        return token
      }

      // Check if we have required token data
      if (!token.expiresAt || !token.refreshToken) {
        return token
      }

      // Quick expiry check - return immediately if token is still valid
      const now = Date.now()
      const expiresAtMs = (token.expiresAt as number) * 1000
      const bufferMs = 60 * 1000 // 60 second buffer

      if (now < (expiresAtMs - bufferMs)) {
        // Token still valid, return as-is (fast path - no object creation)
        return token
      }

      // Token expired, need to refresh
      console.log("Token expired, attempting refresh")
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      // If there's an error with the token, return invalid session to force re-auth
      if (token.error) {
        console.error("Session has error, returning invalid session")
        return {
          ...session,
          error: token.error,
          user: undefined,
        } as any
      }

      // CRITICAL: Check if token has required data
      if (!token.accessToken || !token.userId) {
        console.error("Missing required token data - accessToken or userId undefined")
        return {
          ...session,
          error: "InvalidToken",
          user: undefined,
        } as any
      }

      // Send properties to the client
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.userId as string,
          email: session.user?.email,
          name: session.user?.name,
          organisationId: token.organisationId,
          roles: token.roles,
        },
        error: undefined,
      }
    },
  },
  events: {
    async signOut({ token }) {
      // Revoke the token on Keycloak side when user signs out
      if (token && (token as any).idToken) {
        try {
          const logoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
          await fetch(logoutUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
              id_token_hint: (token as any).idToken as string,
            }),
          })
        } catch (error) {
          console.error("Error logging out from Keycloak:", error)
        }
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
