# Multi-Tenant Architecture Documentation

## Overview

This document describes the multi-tenant architecture implementation for the Landy AI platform. The system uses **subdomain-based tenancy** where each customer organization accesses the application via their own subdomain (e.g., `customer1.landy.ai`, `customer2.landy.ai`).

## Architecture Pattern

**Subdomain-Based Multi-Tenancy**
- Each tenant has a unique subdomain
- Tenant resolution happens at the middleware layer
- Each tenant maps to a separate Keycloak realm
- Tenant-specific branding and feature flags
- Complete data isolation per tenant

## Implementation Phases

### ✅ Phase 1: Tenant Resolution Infrastructure (COMPLETED)
**Status:** Complete
**Documentation:** [MULTI_TENANT_PHASE1.md](./MULTI_TENANT_PHASE1.md)

**Deliverables:**
- [x] Tenant configuration service with registry
- [x] Middleware tenant resolution from hostname
- [x] React Context provider for tenant
- [x] Cookie-based tenant persistence
- [x] Invalid tenant error handling
- [x] Environment configuration

**Key Files:**
- `/lib/tenant/tenant-config.ts` - Tenant service and registry
- `/middleware.ts` - Tenant resolution and validation
- `/components/providers/tenant-provider.tsx` - React context
- `/app/tenant-not-found/page.tsx` - Error page

### 🚧 Phase 2: Dynamic Keycloak Configuration (PLANNED)
**Status:** Planned
**Timeline:** Weeks 3-4

**Goals:**
- Dynamic NextAuth configuration per tenant
- Tenant-specific Keycloak realm routing
- Tenant stored in JWT token
- Session tenant validation
- Multi-realm Keycloak setup

**Key Changes:**
- `/app/api/auth/[...nextauth]/route.ts` - Dynamic config
- `/components/providers/auth-provider.tsx` - Tenant-aware methods
- `/types/next-auth.d.ts` - Add tenant to session types
- `/middleware.ts` - Session tenant validation

### 🔮 Phase 3: Dynamic UI Branding (PLANNED)
**Status:** Planned
**Timeline:** Weeks 5-6

**Goals:**
- Tenant-specific logos and colors
- Dynamic app name per tenant
- Tenant asset management
- Feature flags per tenant

**Key Changes:**
- `/components/tenant/tenant-logo.tsx`
- `/components/tenant/tenant-app-name.tsx`
- `/app/login/page.tsx` - Dynamic branding
- `/app/signup/page.tsx` - Dynamic branding
- `/public/tenants/` - Asset directories

### 🚀 Phase 4: Production Deployment (PLANNED)
**Status:** Planned
**Timeline:** Weeks 7-8

**Goals:**
- Wildcard DNS configuration
- SSL certificate provisioning
- Production environment setup
- Keycloak multi-realm deployment
- End-to-end testing

## Architecture Components

### 1. Tenant Configuration Service

**Location:** `/lib/tenant/tenant-config.ts`

**Purpose:** Central registry for tenant configurations

**Interface:**
```typescript
interface TenantConfig {
  id: string                    // Internal tenant ID
  subdomain: string             // URL subdomain
  keycloakRealm: string         // Keycloak realm name
  keycloakClientId: string      // OAuth client ID
  keycloakClientSecret: string  // OAuth client secret
  name: string                  // Display name
  branding: {
    logo: string                // Logo path/URL
    primaryColor: string        // Brand color
    appName: string             // App name
  }
  features: {
    aiAssistant: boolean
    productHub: boolean
    analytics: boolean
  }
  customDomain?: string         // Optional custom domain
}
```

**Methods:**
- `getTenantFromHostname(hostname)` - Extract tenant from URL
- `getTenantConfig(subdomain)` - Load tenant configuration
- `isValidTenant(subdomain)` - Validate tenant exists
- `getAllTenants()` - List all tenants

### 2. Middleware Tenant Resolution

**Location:** `/middleware.ts`

**Responsibilities:**
1. Extract tenant from request hostname
2. Validate tenant exists in registry
3. Redirect invalid tenants to error page
4. Set tenant cookie for client access
5. Inject tenant headers for server components
6. Handle authentication with NextAuth
7. Protect routes based on authentication

**Flow:**
```
Request arrives
    ↓
Extract subdomain from hostname
    ↓
Validate tenant exists
    ↓
Load tenant configuration
    ↓
Check authentication (NextAuth)
    ↓
Set tenant cookie + headers
    ↓
Continue to page or redirect
```

### 3. Tenant Context Provider

**Location:** `/components/providers/tenant-provider.tsx`

**Purpose:** Provide tenant context to React components

**Usage:**
```typescript
import { useTenant } from '@/components/providers/tenant-provider'

function MyComponent() {
  const { tenant, loading } = useTenant()

  if (loading) return <Spinner />
  if (!tenant) return <Error />

  return <h1>{tenant.branding.appName}</h1>
}
```

**Data Flow:**
```
Middleware sets cookie: tenant=customer1
    ↓
TenantProvider reads cookie on mount
    ↓
Loads TenantConfig from TenantService
    ↓
Exposes via React Context
    ↓
Components access via useTenant() hook
```

### 4. Cookie Strategy

**Why Cookies?**
- Bridge between server (middleware) and client (React)
- Persist across page navigation
- Available in both server and client components
- Automatic with every request

**Cookie Configuration:**
```typescript
{
  name: 'tenant',
  value: 'customer1',
  httpOnly: false,      // Client can read it
  secure: true,         // HTTPS only (production)
  sameSite: 'lax',      // OAuth redirects allowed
  maxAge: 365 days,     // Long-lived
  path: '/'             // All routes
}
```

**Security:**
- Not httpOnly because React needs to read it
- Safe because tenant subdomain is public (in URL)
- Validated on every request in middleware
- Cannot be used to bypass authentication

## Tenant Registry

**Current Tenants:**

| Subdomain | Name | Keycloak Realm | Features |
|-----------|------|----------------|----------|
| `audiscope` | Landy AI | `audiscope` | All (default) |
| `customer1` | Acme Medical | `customer1-realm` | All |
| `customer2` | BioTech Corp | `customer2-realm` | AI + Analytics only |

**Adding a New Tenant:**

1. Add to registry in `/lib/tenant/tenant-config.ts`:
```typescript
'newcustomer': {
  id: 'newcustomer',
  subdomain: 'newcustomer',
  keycloakRealm: 'newcustomer-realm',
  keycloakClientId: 'newcustomer-web',
  keycloakClientSecret: process.env.KEYCLOAK_NEWCUSTOMER_SECRET!,
  name: 'New Customer Inc',
  branding: {
    logo: '/tenants/newcustomer/logo.svg',
    primaryColor: '#3B82F6',
    appName: 'New Customer Portal'
  },
  features: {
    aiAssistant: true,
    productHub: true,
    analytics: true
  }
}
```

2. Create Keycloak realm: `newcustomer-realm`
3. Add environment variable: `KEYCLOAK_NEWCUSTOMER_SECRET`
4. Create tenant assets in `/public/tenants/newcustomer/`
5. Configure DNS: `newcustomer.landy.ai`

## URL Structure

### Development
```
http://localhost:3000              → audiscope (DEV_TENANT fallback)
http://audiscope.localhost:3000    → audiscope
http://customer1.localhost:3000    → customer1
http://customer2.localhost:3000    → customer2
```

**Setup:** Add to `/etc/hosts`:
```
127.0.0.1 audiscope.localhost
127.0.0.1 customer1.localhost
127.0.0.1 customer2.localhost
```

### Production
```
https://customer1.landy.ai         → customer1
https://customer2.landy.ai         → customer2
https://audiscope.landy.ai         → audiscope
```

**DNS:** Wildcard CNAME: `*.landy.ai → vercel`

## Security Model

### Tenant Isolation

**Level 1: URL-Based**
- Each tenant has unique subdomain
- Browser automatically isolates cookies by domain

**Level 2: Cookie Validation**
- Middleware validates subdomain matches cookie
- Mismatch triggers cookie reset

**Level 3: Session Validation (Phase 2)**
- JWT token includes tenant ID
- Every request validates token tenant matches URL tenant
- Cross-tenant access blocked

**Level 4: Data Isolation**
- Backend filters all queries by `organisation_id`
- User's organisation_id from JWT token
- No cross-tenant data leakage

### Authentication Flow

```
User visits customer1.landy.ai/login
    ↓
Middleware sets: cookie tenant=customer1
    ↓
User clicks "Sign In"
    ↓
NextAuth redirects to: auth.landy.ai/realms/customer1-realm
    ↓
User authenticates in Keycloak
    ↓
Keycloak redirects back with code
    ↓
NextAuth exchanges code for tokens
    ↓
JWT token includes: { tenant: "customer1", org_id: "..." }
    ↓
Session created with tenant context
    ↓
Dashboard loads with tenant branding
```

### Security Checklist

- [x] Tenant validation in middleware
- [x] Cookie scoped to subdomain
- [x] Invalid tenant error page
- [ ] Session tenant validation (Phase 2)
- [ ] JWT token includes tenant (Phase 2)
- [ ] Cross-tenant session blocked (Phase 2)
- [ ] Backend organisation_id filtering (existing)
- [ ] Rate limiting per tenant (future)
- [ ] Audit logging (future)

## Environment Configuration

### Required Variables

**.env.local / .env.development:**
```bash
# Multi-Tenant
DEV_TENANT=audiscope

# Keycloak Base
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080

# Default Tenant (fallback)
KEYCLOAK_ISSUER=http://localhost:8080/realms/audiscope
KEYCLOAK_CLIENT_ID=audiscope-web
KEYCLOAK_CLIENT_SECRET=<secret>

# Tenant-Specific Secrets (optional)
KEYCLOAK_CUSTOMER1_SECRET=<customer1-secret>
KEYCLOAK_CUSTOMER2_SECRET=<customer2-secret>

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret>
```

**Production:**
```bash
# Multi-Tenant
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.landy.ai

# Tenant Secrets
KEYCLOAK_CUSTOMER1_SECRET=<prod-secret>
KEYCLOAK_CUSTOMER2_SECRET=<prod-secret>

# NextAuth
NEXTAUTH_URL=https://app.landy.ai
NEXTAUTH_SECRET=<prod-secret>
```

## Development Workflow

### Local Development

1. **Start Keycloak** (if not running):
```bash
# Docker or local Keycloak instance
keycloak start-dev --http-port=8080
```

2. **Start Application**:
```bash
bun dev
```

3. **Access Tenants**:
- Default: `http://localhost:3000` (uses DEV_TENANT)
- Subdomain: `http://customer1.localhost:3000` (requires /etc/hosts)

### Testing Multiple Tenants

**Option 1: Browser Profiles**
- Chrome Profile 1 → customer1.localhost:3000
- Chrome Profile 2 → customer2.localhost:3000

**Option 2: Incognito Windows**
- Window 1 → customer1
- Window 2 → customer2

### Debugging

**Check Tenant Resolution:**
```typescript
// Add to any page
console.log('Tenant:', document.cookie.match(/tenant=([^;]+)/)?.[1])
```

**Check Middleware:**
```bash
# Terminal shows middleware logs
[middleware] Tenant resolved: customer1
[middleware] Setting cookie: tenant=customer1
```

**Check Tenant Config:**
```typescript
import { TenantService } from '@/lib/tenant/tenant-config'

// In browser console or server component
console.log(TenantService.getAllTenants())
// ["audiscope", "customer1", "customer2"]
```

## Troubleshooting

### Issue: "tenant-not-found" on localhost

**Cause:** DEV_TENANT not set or invalid

**Fix:**
1. Check `.env.local` has `DEV_TENANT=audiscope`
2. Restart dev server
3. Verify tenant exists in registry

### Issue: Cookie not persisting

**Cause:** Browser settings or extension blocking

**Fix:**
1. Disable cookie-blocking extensions
2. Try incognito mode
3. Check DevTools → Application → Cookies
4. Verify middleware is running (check terminal)

### Issue: Subdomain not resolving

**Cause:** /etc/hosts not configured

**Fix:**
```bash
# Add to /etc/hosts
127.0.0.1 customer1.localhost
127.0.0.1 customer2.localhost

# Verify
ping customer1.localhost
# Should respond from 127.0.0.1
```

## Performance Considerations

### Tenant Config Caching

- TenantService uses in-memory cache
- Cache TTL: 5 minutes
- Reduces registry lookups

### Middleware Performance

- Runs on every request (Vercel Edge)
- Minimal overhead (~1-2ms)
- Cookie check is fast
- No database queries

### Future Optimizations

- [ ] Database-backed tenant registry (dynamic tenants)
- [ ] Edge caching for tenant configs
- [ ] CDN caching for tenant assets
- [ ] Preload tenant configs at build time

## Related Documentation

- [Phase 1: Tenant Resolution](./MULTI_TENANT_PHASE1.md) - Testing guide
- [GitHub Issue #13](https://github.com/jamesmagoo/audiscope/issues/13) - Full architecture plan
- [AI Features Roadmap](./AI_FEATURES_ROADMAP.md) - Product roadmap

## Glossary

**Tenant:** An organization/customer using the platform (e.g., Acme Medical)

**Subdomain:** URL prefix identifying tenant (e.g., `customer1` in `customer1.landy.ai`)

**Keycloak Realm:** Isolated authentication domain per tenant in Keycloak

**TenantService:** Class managing tenant configuration and resolution

**Middleware:** Server-side code running on every request before page loads

**TenantProvider:** React Context providing tenant data to components

**Organisation ID:** Database identifier for tenant (stored in JWT, used for data filtering)

## Support

For questions or issues with multi-tenant implementation:
1. Check this documentation
2. Review Phase 1 testing guide
3. Check GitHub Issue #13 for architecture decisions
4. Contact: james@landy.ai
