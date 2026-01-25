# Vercel Multi-Customer Deployment Strategy

## Overview

This document describes how to deploy multiple customer instances of the Landy AI platform on Vercel using separate projects with environment-specific configuration.

## Architecture Approach

**Strategy**: One Vercel Project per Customer Subdomain

Each customer gets their own isolated Vercel deployment:
- `audiscope.landy.ai` → Vercel Project: "landy-audiscope"
- `uniphar.landy.ai` → Vercel Project: "landy-uniphar"

**Benefits**:
- ✅ Complete isolation (one customer's issues don't affect others)
- ✅ Independent scaling per customer
- ✅ Separate analytics and logs
- ✅ Customer-specific rollback capability
- ✅ Different versions per customer if needed
- ✅ Simplified security (no cross-tenant logic)

**Trade-offs**:
- ❌ Multiple deployments to manage
- ❌ Code changes require multiple deploys
- ❌ Higher infrastructure costs (multiple Vercel projects)

## Deployment Steps

### 1. Create Vercel Projects

**For each customer, create a new Vercel project:**

#### Audiscope (Demo) Deployment
```bash
# In Vercel Dashboard:
1. New Project
2. Import from Git: github.com/your-org/audiscope
3. Name: "landy-audiscope"
4. Framework: Next.js
5. Root Directory: ./
6. Environment Variables: (see below)
7. Deploy
```

#### Uniphar Deployment
```bash
# In Vercel Dashboard:
1. New Project
2. Import from Git: github.com/your-org/audiscope (same repo)
3. Name: "landy-uniphar"
4. Framework: Next.js
5. Root Directory: ./
6. Environment Variables: (see below)
7. Deploy
```

---

### 2. Configure Environment Variables Per Project

#### Audiscope Environment Variables

**Vercel Project: landy-audiscope**

```bash
# Multi-Tenant
DEV_TENANT=audiscope

# Keycloak Authentication
KEYCLOAK_ISSUER=https://auth.landy.ai/realms/audiscope
KEYCLOAK_CLIENT_ID=audiscope-web
KEYCLOAK_CLIENT_SECRET=<audiscope-secret-from-keycloak>

# Keycloak Public (Client-side)
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.landy.ai
NEXT_PUBLIC_KEYCLOAK_REALM=audiscope
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=audiscope-web

# NextAuth
NEXTAUTH_URL=https://audiscope.landy.ai
NEXTAUTH_SECRET=<random-secret-for-audiscope>

# Backend Core API
CORE_API_URL=https://api-audiscope.landy.ai/api

# Optional: Sentry, Analytics, etc.
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn-audiscope>
```

#### Uniphar Environment Variables

**Vercel Project: landy-uniphar**

```bash
# Multi-Tenant
DEV_TENANT=uniphar

# Keycloak Authentication
KEYCLOAK_ISSUER=https://auth.landy.ai/realms/uniphar
KEYCLOAK_CLIENT_ID=uniphar-web
KEYCLOAK_CLIENT_SECRET=<uniphar-secret-from-keycloak>

# Keycloak Public (Client-side)
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.landy.ai
NEXT_PUBLIC_KEYCLOAK_REALM=uniphar
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=uniphar-web

# NextAuth
NEXTAUTH_URL=https://uniphar.landy.ai
NEXTAUTH_SECRET=<random-secret-for-uniphar>

# Backend Core API
CORE_API_URL=https://api-uniphar.landy.ai/api
# OR shared backend:
# CORE_API_URL=https://api.landy.ai/api

# Optional: Sentry, Analytics, etc.
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn-uniphar>
```

**Important**:
- Use different `NEXTAUTH_SECRET` per customer
- Use different Keycloak realms and client secrets
- Backend API can be shared or separate per customer

---

### 3. Configure Custom Domains

#### DNS Configuration

**At your DNS provider (e.g., Cloudflare, Namecheap)**:

```
# Audiscope
Type: CNAME
Name: audiscope
Value: cname.vercel-dns.com
TTL: Auto

# Uniphar
Type: CNAME
Name: uniphar
Value: cname.vercel-dns.com
TTL: Auto
```

#### Vercel Domain Setup

**For audiscope.landy.ai:**
1. Go to Vercel Project: "landy-audiscope"
2. Settings → Domains
3. Add Domain: `audiscope.landy.ai`
4. Verify DNS configuration
5. Wait for SSL certificate provisioning (~1-5 minutes)

**For uniphar.landy.ai:**
1. Go to Vercel Project: "landy-uniphar"
2. Settings → Domains
3. Add Domain: `uniphar.landy.ai`
4. Verify DNS configuration
5. Wait for SSL certificate provisioning

---

### 4. Keycloak Multi-Realm Configuration

**Create separate realms per customer**:

#### Audiscope Realm

```bash
# In Keycloak Admin Console:
1. Create Realm: "audiscope"
2. Create Client: "audiscope-web"
   - Client Protocol: openid-connect
   - Access Type: confidential
   - Valid Redirect URIs:
     - https://audiscope.landy.ai/*
     - https://audiscope.landy.ai/api/auth/callback/keycloak
     - http://localhost:3000/* (for dev)
   - Web Origins: https://audiscope.landy.ai
3. Copy Client Secret → Use in KEYCLOAK_CLIENT_SECRET
4. Configure Role Mappers (see Keycloak docs)
5. Create test users
```

#### Uniphar Realm

```bash
# In Keycloak Admin Console:
1. Create Realm: "uniphar"
2. Create Client: "uniphar-web"
   - Client Protocol: openid-connect
   - Access Type: confidential
   - Valid Redirect URIs:
     - https://uniphar.landy.ai/*
     - https://uniphar.landy.ai/api/auth/callback/keycloak
     - http://localhost:3000/* (for dev)
   - Web Origins: https://uniphar.landy.ai
3. Copy Client Secret → Use in KEYCLOAK_CLIENT_SECRET
4. Configure Role Mappers
5. Import Uniphar users or enable registration
```

---

### 5. Testing Checklist

#### Before Production Launch

**Per Customer Deployment**:

- [ ] Environment variables configured correctly
- [ ] Custom domain added and SSL working
- [ ] Keycloak realm created with correct client
- [ ] Test login/logout flow
- [ ] Verify tenant name shows in sidebar (DEMO vs Uniphar)
- [ ] Test authenticated API calls
- [ ] Check Sentry error tracking (if enabled)
- [ ] Performance test (Lighthouse/WebPageTest)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive testing

**Cross-Tenant Validation**:

- [ ] Verify no data leakage between tenants
- [ ] Confirm sessions don't cross tenants
- [ ] Test that audiscope users can't access uniphar data
- [ ] Verify backend organisation_id filtering works

---

### 6. Ongoing Maintenance

#### Deploying Code Updates

**Option 1: Deploy to All Customers (recommended)**

```bash
# Git push triggers all Vercel projects via Git integration
git push origin main

# Both projects auto-deploy:
# - landy-audiscope deploys with audiscope env vars
# - landy-uniphar deploys with uniphar env vars
```

**Option 2: Selective Deployment**

```bash
# Deploy only to specific customer
# In Vercel Dashboard:
1. Go to project (e.g., landy-uniphar)
2. Deployments tab
3. Click "..." → Redeploy
4. Select branch and environment
```

#### Environment Variable Updates

```bash
# To update env var for a customer:
1. Go to Vercel Project (e.g., landy-uniphar)
2. Settings → Environment Variables
3. Edit variable
4. Trigger new deployment (automatic or manual)
```

#### Monitoring & Alerts

**Per-Customer Metrics**:
- Vercel Analytics (per project)
- Sentry Error Tracking (per DSN)
- Custom dashboards (Datadog, New Relic, etc.)

**Shared Monitoring**:
- Backend API health checks
- Keycloak realm availability
- Database connection pool

---

### 7. Scaling to More Customers

#### Adding a New Customer (e.g., "customer3")

**Step-by-step**:

1. **Update Tenant Registry** (`lib/tenant/tenant-config.ts`):
   ```typescript
   'customer3': {
     id: 'customer3',
     subdomain: 'customer3',
     keycloakRealm: 'customer3',
     keycloakClientId: 'customer3-web',
     keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
     name: 'Customer3 Inc',
     branding: { ... },
     features: { ... }
   }
   ```

2. **Create Keycloak Realm**: "customer3"

3. **Create Vercel Project**: "landy-customer3"

4. **Configure Environment Variables** (per template above)

5. **Add DNS**: `customer3.landy.ai` → Vercel

6. **Test & Deploy**

**Timeline**: ~2 hours per new customer

---

### 8. Cost Optimization

#### Vercel Pricing Considerations

**Pro Plan** (recommended for production):
- $20/month per project (per customer)
- 100GB bandwidth per project
- Unlimited team members
- Advanced analytics

**Enterprise Plan** (for 5+ customers):
- Custom pricing
- Centralized billing
- Advanced security features
- Support SLA

**Cost Example**:
- 2 customers (audiscope + uniphar)
- Pro Plan: $20 × 2 = $40/month
- Enterprise Plan: Contact Vercel sales

#### Alternative: Monorepo with Shared Deployment

**If cost becomes an issue**, consider:
- Single Vercel project with dynamic tenant routing
- Use middleware to route based on subdomain
- Shared deployment, separate environment configs
- Trade-off: Loss of isolation benefits

---

### 9. Disaster Recovery

#### Backup Strategy

**Code**:
- Git repository (GitHub/GitLab) - primary backup
- Vercel automatic snapshots

**Env Variables**:
- Export from Vercel CLI: `vercel env pull .env.production`
- Store in password manager (1Password, Bitwarden)
- Backup in secure location (encrypted)

**Rollback Procedure**:
1. Identify problematic deployment
2. Go to Vercel Project → Deployments
3. Find last working deployment
4. Click "..." → Promote to Production
5. Verify functionality

**Recovery Time Objective (RTO)**: < 5 minutes

---

### 10. Security Checklist

- [ ] HTTPS enforced on all domains
- [ ] Keycloak client secrets rotated regularly
- [ ] NEXTAUTH_SECRET is unique per customer
- [ ] CORS configured correctly per backend
- [ ] Rate limiting enabled (Vercel Edge Config or backend)
- [ ] Sentry DSN per customer (for error isolation)
- [ ] No sensitive data in client-side env vars
- [ ] Backend validates JWT issuer matches expected realm
- [ ] Regular security audits via `npm audit`

---

## Troubleshooting

### Issue: Deployment fails with "Missing environment variables"

**Solution**:
1. Check Vercel Project → Settings → Environment Variables
2. Ensure all required variables are set (see template above)
3. Verify variable names match exactly (case-sensitive)
4. Trigger new deployment

### Issue: Custom domain shows "Domain Not Found"

**Solution**:
1. Check DNS propagation: `dig audiscope.landy.ai`
2. Verify CNAME points to `cname.vercel-dns.com`
3. Wait 5-10 minutes for DNS propagation
4. Clear browser cache

### Issue: Login redirects to wrong Keycloak realm

**Solution**:
1. Check `KEYCLOAK_ISSUER` and `NEXT_PUBLIC_KEYCLOAK_REALM` match
2. Verify `DEV_TENANT` matches realm name
3. Clear browser cookies and try again
4. Check Vercel deployment logs for auth errors

---

## Contact & Support

**Vercel Issues**: support@vercel.com
**Keycloak Issues**: keycloak-user@lists.jboss.org
**Platform Issues**: james@landy.ai
