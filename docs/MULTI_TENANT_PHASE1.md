# Phase 1: Tenant Resolution Infrastructure - Testing Guide

## ✅ Completed Implementation

### Files Created
- `/lib/tenant/tenant-config.ts` - Tenant configuration service with TenantService class
- `/components/providers/tenant-provider.tsx` - React Context provider for tenant
- `/app/tenant-not-found/page.tsx` - Error page for invalid tenants

### Files Modified
- `/middleware.ts` - Enhanced with tenant resolution and validation
- `/app/layout.tsx` - Wrapped with TenantProvider
- `.env.local` - Added DEV_TENANT=audiscope
- `.env.development` - Added DEV_TENANT=audiscope

### Dependencies Added
- `js-cookie` - Cookie handling library
- `@types/js-cookie` - TypeScript types for js-cookie

---

## 🧪 Testing Checklist

### 1. Default Tenant Resolution (localhost)

**Test:** Access app on localhost
```bash
# Start dev server
bun dev

# Open browser
http://localhost:3000
```

**Expected:**
- ✅ App loads successfully
- ✅ No tenant-not-found errors
- ✅ Cookie `tenant=audiscope` is set
- ✅ Browser console shows no errors
- ✅ Can navigate to /login, /signup, /dashboard

**How to verify:**
1. Open DevTools → Application → Cookies
2. Look for cookie: `tenant` with value `audiscope`

---

### 2. Tenant Cookie Persistence

**Test:** Verify cookie persists across navigation
```bash
# Navigate through pages
http://localhost:3000
→ http://localhost:3000/login
→ http://localhost:3000/dashboard
```

**Expected:**
- ✅ Cookie remains `tenant=audiscope` on all pages
- ✅ No cookie is recreated on each navigation
- ✅ Cookie has maxAge of 1 year

---

### 3. TenantProvider Context

**Test:** Verify tenant context is available in React components

Add this test component temporarily to any page:

```tsx
"use client"
import { useTenant } from '@/components/providers/tenant-provider'

export function TenantDebug() {
  const { tenant, loading } = useTenant()

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, background: 'yellow', padding: 10 }}>
      <pre>{JSON.stringify({ loading, tenant: tenant?.subdomain }, null, 2)}</pre>
    </div>
  )
}
```

**Expected:**
- ✅ Shows `loading: false`
- ✅ Shows `tenant: "audiscope"`
- ✅ Tenant config includes branding data

---

### 4. Invalid Tenant Handling

**Test:** Try to access with invalid tenant (requires /etc/hosts modification)

**Setup:**
```bash
# Add to /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 invalid-tenant.localhost
```

**Test:**
```bash
http://invalid-tenant.localhost:3000
```

**Expected:**
- ✅ Redirects to `/tenant-not-found`
- ✅ Shows error page with "Organisation Not Found"
- ✅ Console shows warning: `Invalid tenant: invalid-tenant from hostname: ...`

---

### 5. Middleware Tenant Validation

**Test:** Check middleware logs

**How to test:**
1. Clear browser cookies
2. Access `http://localhost:3000`
3. Check terminal output

**Expected Logs:**
```
# No errors or warnings for valid tenant (audiscope)
# Middleware should silently set tenant cookie
```

**Test invalid tenant:**
1. Modify `.env.local` temporarily: `DEV_TENANT=nonexistent`
2. Restart dev server
3. Access `http://localhost:3000`

**Expected:**
- ✅ Console warning: `Invalid tenant: nonexistent from hostname: localhost`
- ✅ Redirects to `/tenant-not-found`

---

### 6. Build Verification

**Test:** Ensure production build succeeds
```bash
rm -rf .next && bun run build
```

**Expected:**
- ✅ Build completes successfully
- ✅ No TypeScript errors in middleware.ts
- ✅ `/tenant-not-found` appears in build output
- ✅ Middleware size shown in build stats

---

### 7. Test Multiple Tenant Configurations

**Test:** Verify tenant registry has multiple tenants

**How to verify:**
```typescript
// In browser console (after importing TenantService)
// Or add temporary server-side log:

// lib/tenant/tenant-config.ts
console.log('Available tenants:', TenantService.getAllTenants())
// Expected: ['audiscope', 'customer1', 'customer2']
```

**Expected:**
- ✅ Registry contains 3 tenants: audiscope, customer1, customer2
- ✅ Each tenant has complete configuration (branding, features, Keycloak realm)

---

## 🔍 Manual Testing: Subdomain Resolution

### Setup Local Subdomains

**1. Edit hosts file:**
```bash
# macOS/Linux
sudo nano /etc/hosts

# Windows (as Administrator)
notepad C:\Windows\System32\drivers\etc\hosts
```

**2. Add entries:**
```
127.0.0.1 customer1.localhost
127.0.0.1 customer2.localhost
127.0.0.1 audiscope.localhost
```

**3. Test subdomain resolution:**
```bash
# Terminal 1: Start dev server
bun dev

# Browser tests:
http://audiscope.localhost:3000     → should work (tenant=audiscope)
http://customer1.localhost:3000     → should work (tenant=customer1)
http://customer2.localhost:3000     → should work (tenant=customer2)
http://invalid.localhost:3000       → should redirect to /tenant-not-found
```

**Expected for valid tenants:**
- ✅ Page loads successfully
- ✅ Cookie `tenant` set to correct subdomain
- ✅ No console errors
- ✅ Middleware logs show tenant resolution

**Expected for invalid tenants:**
- ✅ Redirects to `/tenant-not-found`
- ✅ Shows error page
- ✅ Console warning about invalid tenant

---

## 🐛 Troubleshooting

### Issue: "tenant-not-found" on localhost

**Solution:**
1. Check `.env.local` has `DEV_TENANT=audiscope`
2. Restart dev server
3. Clear browser cookies
4. Verify tenant exists in `lib/tenant/tenant-config.ts` registry

### Issue: Cookie not being set

**Solution:**
1. Check browser DevTools → Application → Cookies
2. Verify middleware is running (check terminal logs)
3. Check middleware matcher in `middleware.ts` includes your route
4. Try incognito/private mode to rule out extension conflicts

### Issue: "Cannot find module js-cookie"

**Solution:**
```bash
bun add js-cookie @types/js-cookie
```

### Issue: TypeScript errors in middleware

**Solution:**
```bash
# Check for errors
bun typecheck

# Should only see pre-existing errors, not in middleware.ts
```

---

## 📊 Success Criteria for Phase 1

- [x] TenantService resolves tenant from hostname
- [x] Middleware validates tenant and sets cookies
- [x] TenantProvider exposes tenant context to React
- [x] Invalid tenants redirect to error page
- [x] Multiple tenant configurations supported
- [x] Production build succeeds
- [x] No TypeScript errors in new code
- [x] Cookies persist across navigation
- [x] Works on localhost with DEV_TENANT fallback
- [x] Works with subdomain.localhost (when hosts file configured)

---

## 🎯 Next Steps: Phase 2

Once Phase 1 testing is complete, we'll proceed to **Phase 2: Dynamic Keycloak Configuration**

**Phase 2 will add:**
- Dynamic NextAuth configuration based on tenant
- Tenant-specific Keycloak realms
- Tenant stored in JWT token
- Session tenant validation
- Multi-realm Keycloak setup

**Before starting Phase 2, ensure:**
1. All Phase 1 tests pass
2. No errors in browser console
3. Cookies working correctly
4. Subdomain resolution tested (at least with localhost subdomains)

---

## 🔗 Related Files

**Core Infrastructure:**
- `/lib/tenant/tenant-config.ts` - Tenant registry and resolution
- `/middleware.ts` - Tenant validation and cookie setting
- `/components/providers/tenant-provider.tsx` - React context

**Error Handling:**
- `/app/tenant-not-found/page.tsx` - Invalid tenant error page

**Configuration:**
- `.env.local` - Development environment (DEV_TENANT)
- `.env.development` - LocalStack environment

**Documentation:**
- GitHub Issue #13 - Complete multi-tenant architecture plan
- `PHASE1_TESTING.md` - This file
