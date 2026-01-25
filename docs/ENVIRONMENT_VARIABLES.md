# Environment Variables Reference

This document explains all environment variables used in AudiScope and their purpose.

## Environment Files

AudiScope uses **two environment files** (not committed to git):

1. **`.env.dev-cloud`** - Cloud development with multi-tenant subdomains
2. **`.env.development`** - Local development with LocalStack

**Important:** DO NOT create `.env.local` as it overrides environment-specific files and causes conflicts.

## Switching Environments

```bash
# Use cloud resources with multi-tenant support
bun prod   # Uses .env.dev-cloud

# Use LocalStack and local backend
bun local  # Uses .env.development
```

---

## Multi-Tenant Configuration

### DEV_TENANT
**Type:** Server-side
**Purpose:** Default tenant for localhost (when no subdomain is present)
**Values:** `audiscope` (default), `uniphar`

```bash
DEV_TENANT=audiscope
```

**How it works:**
- When accessing `localhost:3000` → uses `audiscope` tenant
- When accessing `audiscope.localhost:3000` → uses `audiscope` tenant (from subdomain)
- When accessing `uniphar.localhost:3000` → uses `uniphar` tenant (from subdomain)

---

## Keycloak Authentication (NextAuth v4)

### Server-Side Variables (NOT exposed to browser)

#### KEYCLOAK_ISSUER
**Purpose:** Keycloak OpenID Connect issuer URL
**Used by:** NextAuth server-side token validation

```bash
KEYCLOAK_ISSUER=http://localhost:8080/realms/audiscope
```

#### KEYCLOAK_CLIENT_ID
**Purpose:** Keycloak client ID for server-side authentication
**Used by:** NextAuth KeycloakProvider

```bash
KEYCLOAK_CLIENT_ID=audiscope-web
```

#### KEYCLOAK_CLIENT_SECRET
**Purpose:** Keycloak client secret for server-side token exchange
**Security:** NEVER expose to browser - server-side only

```bash
KEYCLOAK_CLIENT_SECRET=your-secret-from-keycloak
```

### Client-Side Variables (Exposed to browser)

#### NEXT_PUBLIC_KEYCLOAK_URL
**Purpose:** Keycloak base URL for client-side redirects
**Used by:** Registration and password reset flows in `auth-provider.tsx`

```bash
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
```

#### NEXT_PUBLIC_KEYCLOAK_REALM
**Purpose:** Keycloak realm name for client-side flows
**Used by:** Registration and password reset URLs

```bash
NEXT_PUBLIC_KEYCLOAK_REALM=audiscope
```

#### NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
**Purpose:** Keycloak client ID for client-side operations
**Used by:** Client-side redirects and registration

```bash
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=audiscope-web
```

---

## NextAuth Configuration

### NEXTAUTH_URL
**Type:** Server-side
**Purpose:** Base URL for NextAuth callbacks and redirects
**Critical:** Must match the subdomain you're accessing from

```bash
# For multi-tenant cloud dev (.env.dev-cloud)
NEXTAUTH_URL=http://audiscope.localhost:3000

# For local dev (.env.development)
NEXTAUTH_URL=http://localhost:3000
```

**How it works with multi-tenant:**
- Combined with `trustHost: true` in `lib/auth.ts`
- NextAuth uses the request's Host header for dynamic redirects
- After login from `audiscope.localhost:3000`, redirects back to `audiscope.localhost:3000`

### NEXTAUTH_SECRET
**Type:** Server-side
**Purpose:** Secret for signing JWT tokens
**Security:** Generate with `openssl rand -base64 32`

```bash
NEXTAUTH_SECRET=m9TbYU4yZCqwgeoWWBMKjyB0wDPx21JwX5/Z0HoK0/c=
```

---

## Backend APIs

AudiScope uses a **dual backend architecture**:

### Backend 1: AWS API Gateway (Audio Assessment Pipeline)

#### NEXT_PUBLIC_API_GATEWAY_URL
**Type:** Client-side
**Purpose:** AWS Lambda-based audio assessment pipeline
**Used for:** Audio transcription, analysis, and processing

```bash
NEXT_PUBLIC_API_GATEWAY_URL=https://m0coihjhbk.execute-api.eu-west-1.amazonaws.com
```

### Backend 2: Core API (Product Management)

#### CORE_API_URL
**Type:** Server-side ONLY (NOT exposed to browser)
**Purpose:** Core API URL for Next.js server-side rewrites
**Used in:** `next.config.mjs` for API route rewrites (`/api/core/*`)

```bash
# Local development
CORE_API_URL=http://localhost:5002/api

# Cloud development
CORE_API_URL=http://core-api-dev-alb-766481977.eu-west-1.elb.amazonaws.com/api
```

**Architecture:**
All Core API calls from the frontend use Next.js proxy routes (`/api/core/*`). This provides several benefits:
- **Security**: Backend URL never exposed to browser
- **No CORS issues**: Same-origin requests
- **Centralized configuration**: Single environment variable (`CORE_API_URL`)

**How it works:**
1. Client-side services call `/api/core/v1/products` (see `lib/service/product.service.ts`)
2. Next.js rewrites this to `${CORE_API_URL}/v1/products` server-side
3. Backend URL remains hidden from browser

---

## AWS Bedrock Knowledge Base

### NEXT_PUBLIC_KNOWLEDGE_BASE_ID
**Type:** Client-side
**Purpose:** AWS Bedrock Knowledge Base identifier for AI chat

```bash
NEXT_PUBLIC_KNOWLEDGE_BASE_ID=5WDOTFQ8QC
```

---

## S3 Configuration

### NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE
**Type:** Client-side
**Purpose:** Override S3 endpoint for LocalStack development
**When to use:** ONLY in `.env.development` for local testing

```bash
# In .env.development ONLY
NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE=http://localhost:4566

# In .env.dev-cloud: Leave this UNSET or remove it completely
```

**Important:**
- DO NOT set this in `.env.dev-cloud` (breaks real AWS S3)
- Only for local development with LocalStack
- Automatically transforms S3 URLs in `lib/product-files.service.ts`

---

## Sentry (Optional)

### NEXT_PUBLIC_SENTRY_DSN
**Type:** Client-side
**Purpose:** Sentry error tracking DSN
**When to use:** Production/staging monitoring

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### SENTRY_AUTH_TOKEN
**Type:** Server-side
**Purpose:** Sentry authentication for uploading source maps
**When to use:** Production builds

```bash
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### SENTRY_ORG
**Type:** Server-side
**Purpose:** Sentry organization name

```bash
SENTRY_ORG=landy-ai
```

### SENTRY_PROJECT
**Type:** Server-side
**Purpose:** Sentry project name

```bash
SENTRY_PROJECT=javascript-nextjs
```

---

## Complete Environment File Examples

### .env.dev-cloud (Multi-Tenant Cloud Development)

```bash
# Multi-Tenant Configuration
DEV_TENANT=audiscope

# Keycloak Authentication (Server-side)
KEYCLOAK_ISSUER=http://localhost:8080/realms/audiscope
KEYCLOAK_CLIENT_ID=audiscope-web
KEYCLOAK_CLIENT_SECRET=XZYgAhs9gpr4hzsGChCxCHPfLjCT3dwo

# NextAuth Configuration
NEXTAUTH_URL=http://audiscope.localhost:3000
NEXTAUTH_SECRET=m9TbYU4yZCqwgeoWWBMKjyB0wDPx21JwX5/Z0HoK0/c=

# Keycloak Public Configuration (Client-side)
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=audiscope
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=audiscope-web

# AWS API Gateway (Audio Assessment Pipeline)
NEXT_PUBLIC_API_GATEWAY_URL=https://m0coihjhbk.execute-api.eu-west-1.amazonaws.com

# Core API (Product Management - Cloud Development)
# Server-side only - used in next.config.mjs for API rewrites (/api/core/*)
CORE_API_URL=http://core-api-dev-alb-766481977.eu-west-1.elb.amazonaws.com/api

# AWS Bedrock Knowledge Base
NEXT_PUBLIC_KNOWLEDGE_BASE_ID=5WDOTFQ8QC

# Sentry (disabled for development)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

### .env.development (LocalStack Local Development)

```bash
# Multi-Tenant Configuration
DEV_TENANT=audiscope

# Keycloak Authentication (Server-side)
KEYCLOAK_ISSUER=http://localhost:8080/realms/audiscope
KEYCLOAK_CLIENT_ID=audiscope-web
KEYCLOAK_CLIENT_SECRET=XZYgAhs9gpr4hzsGChCxCHPfLjCT3dwo

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=m9TbYU4yZCqwgeoWWBMKjyB0wDPx21JwX5/Z0HoK0/c=

# Keycloak Public Configuration (Client-side)
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=audiscope
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=audiscope-web

# AWS API Gateway (Real AWS)
NEXT_PUBLIC_API_GATEWAY_URL=https://m0coihjhbk.execute-api.eu-west-1.amazonaws.com

# Core API (Local Development)
# Server-side only - used in next.config.mjs for API rewrites (/api/core/*)
CORE_API_URL=http://localhost:5002/api

# AWS Bedrock Knowledge Base (Real AWS)
NEXT_PUBLIC_KNOWLEDGE_BASE_ID=5WDOTFQ8QC

# LocalStack S3 Override
NEXT_PUBLIC_S3_ENDPOINT_OVERRIDE=http://localhost:4566

# Sentry (disabled for development)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

---

## Best Practices

### Security

1. **NEVER commit environment files to git**
   - `.env.*` files are gitignored
   - Store secrets securely (password manager, vault)

2. **Server-side vs Client-side**
   - Server-side: No `NEXT_PUBLIC_` prefix, NOT exposed to browser
   - Client-side: `NEXT_PUBLIC_` prefix, visible in browser

3. **Production secrets**
   - Generate strong secrets: `openssl rand -base64 32`
   - Rotate secrets regularly
   - Use different secrets per environment

### Development Workflow

1. **Use the correct command for your environment**
   ```bash
   bun prod   # Cloud development (.env.dev-cloud)
   bun local  # Local development (.env.development)
   ```

2. **Restart dev server after changing env files**
   ```bash
   # Stop server (Ctrl+C)
   bun prod  # Restart with new env vars
   ```

3. **Check which environment is active**
   - Open browser console
   - Look for environment-specific URLs in network requests
   - Check if LocalStack URL transformation is active

### Troubleshooting

**Environment not loading:**
- Ensure file name is exact: `.env.dev-cloud` or `.env.development`
- Check no `.env.local` file exists (it overrides others)
- Restart dev server after changes

**Authentication fails:**
- Verify Keycloak is running: `curl http://localhost:8080`
- Check `KEYCLOAK_ISSUER` matches your Keycloak realm
- Ensure `NEXTAUTH_URL` matches the domain you're accessing

**API calls fail:**
- Check `CORE_API_URL` is set in your environment file
- Verify backend is running (for local dev)
- Check browser console Network tab for `/api/core/*` requests
- Check Next.js console for rewrite errors

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Full project documentation
- [DEV_SETUP.md](../ai_docs/DEV_SETUP.md) - Development setup guide
- [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md) - Keycloak configuration guide
- [next.config.mjs](../next.config.mjs) - Next.js config with API rewrites
