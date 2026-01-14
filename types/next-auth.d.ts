import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    error?: string
    user: {
      id: string
      organisationId?: string
      roles?: string[]
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    organisationId?: string
    roles?: string[]
  }

  interface Profile {
    sub: string
    email?: string
    name?: string
    organisation_id?: string
    roles?: string[]
    realm_access?: {
      roles: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    userId?: string
    organisationId?: string
    roles?: string[]
    error?: string
  }
}
