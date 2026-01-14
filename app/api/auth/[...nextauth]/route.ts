import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

export const { handlers, auth, signIn, signOut} = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      // Default OAuth2 behavior - respects existing Keycloak sessions (SSO)
      // Users can switch accounts via Keycloak's account selector
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.userId = profile.sub || undefined

        // Extract roles from Keycloak token
        // Keycloak can provide roles in different formats:
        // 1. profile.roles (if mapped directly)
        // 2. profile.realm_access.roles (standard Keycloak format)
        const roles = profile.roles || (profile.realm_access as any)?.roles || []
        token.roles = roles // Store all roles as array

        // Extract organisation_id from custom user attributes
        if (profile.organisation_id) {
          token.organisationId = profile.organisation_id as string
        }

        // Clear any previous errors
        delete token.error
      }

      // If there's already an error, don't try to refresh
      if (token.error) {
        return token
      }

      // Return previous token if the access token has not expired yet
      // Add 60 second buffer to avoid edge cases
      if (token.expiresAt && Date.now() < ((token.expiresAt as number) - 60) * 1000) {
        return token
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        try {
          console.log("Attempting to refresh access token...")
          const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
            method: "POST",
          })

          const refreshedTokens = await response.json()

          if (!response.ok) {
            console.error("Token refresh failed:", refreshedTokens)
            throw new Error("RefreshAccessTokenError")
          }

          console.log("Token refreshed successfully")
          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            error: undefined, // Clear any previous error
          }
        } catch (error) {
          console.error("Error refreshing access token:", error)
          // Mark token as errored - this will force re-authentication
          return {
            ...token,
            error: "RefreshAccessTokenError",
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      // If there's an error with the token, return null session to force re-auth
      if (token.error) {
        console.error("Session has error, returning invalid session")
        return {
          ...session,
          error: token.error,
          // Clear user to force re-authentication
          user: undefined,
        } as any
      }

      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.user = {
        ...session.user,
        id: token.userId as string,
        organisationId: token.organisationId,
        roles: token.roles,
      }
      session.error = undefined

      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export const { GET, POST } = handlers
