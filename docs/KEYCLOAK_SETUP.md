# Keycloak Client Configuration for Multi-Tenant AudiScope

This document provides step-by-step instructions for configuring Keycloak clients to support AudiScope's multi-tenant architecture with subdomain-based tenant resolution.

## Problem Overview

When accessing AudiScope from tenant-specific subdomains (e.g., `audiscope.localhost:3000`, `uniphar.localhost:3000`), Keycloak needs to recognize these URLs as valid redirect destinations after authentication.

**Error Message:** "We are sorry... Invalid parameter: redirect_uri"

**Root Cause:** The redirect_uri being sent to Keycloak is not registered in the client's "Valid Redirect URIs" list.

## Tenants

Based on `lib/tenant/tenant-config.ts`, AudiScope currently supports:

1. **Audiscope** (default tenant)
   - Realm: `audiscope`
   - Client ID: `audiscope-web`
   - Subdomain: `audiscope.localhost:3000` (development)

2. **Uniphar** (secondary tenant)
   - Realm: `uniphar`
   - Client ID: `uniphar-web`
   - Subdomain: `uniphar.localhost:3000` (development)

## Required Redirect URIs

### Development Environment (localhost)

For **each Keycloak client**, add the following redirect URIs:

#### Base Domain
```
http://localhost:3000/*
http://localhost:3000/api/auth/callback/keycloak
http://localhost:3000/api/auth/logout
```

#### Tenant Subdomains
```
http://audiscope.localhost:3000/*
http://audiscope.localhost:3000/api/auth/callback/keycloak
http://audiscope.localhost:3000/api/auth/logout

http://uniphar.localhost:3000/*
http://uniphar.localhost:3000/api/auth/callback/keycloak
http://uniphar.localhost:3000/api/auth/logout
```

### Production/Staging Environment

Replace `localhost:3000` with your actual domain:

```
https://yourdomain.com/*
https://yourdomain.com/api/auth/callback/keycloak
https://yourdomain.com/api/auth/logout

https://audiscope.yourdomain.com/*
https://audiscope.yourdomain.com/api/auth/callback/keycloak
https://audiscope.yourdomain.com/api/auth/logout

https://uniphar.yourdomain.com/*
https://uniphar.yourdomain.com/api/auth/callback/keycloak
https://uniphar.yourdomain.com/api/auth/logout
```

## Configuration Steps

### 1. Access Keycloak Admin Console

1. Navigate to your Keycloak instance (e.g., `http://localhost:8080`)
2. Login to the Admin Console
3. Select the appropriate **Realm** (e.g., `audiscope` or `uniphar`)

### 2. Configure Client Settings

For **each client** (`audiscope-web`, `uniphar-web`):

#### Step 1: Navigate to Client
1. Go to **Clients** in the left sidebar
2. Click on the client ID (e.g., `audiscope-web`)

#### Step 2: Update Valid Redirect URIs
1. Scroll to **Valid Redirect URIs** section
2. Add all redirect URIs from the list above (one per line)
3. Use wildcards for convenience: `http://localhost:3000/*` and `http://*.localhost:3000/*`

#### Step 3: Update Valid Post Logout Redirect URIs
1. Scroll to **Valid Post Logout Redirect URIs** section
2. Add the same URLs as redirect URIs
3. This allows proper logout flow redirection

#### Step 4: Update Web Origins (CORS)
1. Scroll to **Web Origins** section
2. Add the base origins (without paths):
   ```
   http://localhost:3000
   http://audiscope.localhost:3000
   http://uniphar.localhost:3000
   ```
3. Or use wildcard: `http://*.localhost:3000`

#### Step 5: Save Configuration
1. Click **Save** at the bottom of the page
2. Confirm the settings are persisted

### 3. Verify Configuration

After saving, verify the following sections contain your URLs:

**✓ Valid Redirect URIs:**
```
http://localhost:3000/*
http://*.localhost:3000/*
```

**✓ Valid Post Logout Redirect URIs:**
```
http://localhost:3000/*
http://*.localhost:3000/*
```

**✓ Web Origins:**
```
http://localhost:3000
http://*.localhost:3000
```

## Using Wildcards

Keycloak supports wildcards to simplify configuration:

### Development
```
Valid Redirect URIs:
  http://localhost:3000/*
  http://*.localhost:3000/*

Web Origins:
  http://localhost:3000
  http://*.localhost:3000
```

### Production
```
Valid Redirect URIs:
  https://yourdomain.com/*
  https://*.yourdomain.com/*

Web Origins:
  https://yourdomain.com
  https://*.yourdomain.com
```

**Note:** Using wildcards is convenient but less secure. For production, consider listing specific subdomains explicitly.

## Testing the Configuration

### 1. Start Your Development Server
```bash
bun dev
```

### 2. Test Each Tenant
1. Visit `http://audiscope.localhost:3000`
2. Click "Sign In"
3. You should be redirected to Keycloak login
4. After authentication, you should return to AudiScope dashboard

5. Visit `http://uniphar.localhost:3000`
6. Repeat the login flow
7. Verify successful authentication and redirect

### 3. Test Logout
1. While logged in, click "Logout"
2. You should be redirected to the login page
3. No errors should appear

## Troubleshooting

### Still Getting "Invalid parameter: redirect_uri"

**Check 1: Verify the actual redirect_uri being sent**
- Open browser DevTools (F12)
- Go to Network tab
- Attempt login
- Look for the request to Keycloak `/auth` endpoint
- Check the `redirect_uri` parameter in the URL
- Ensure this exact URL is in your Keycloak configuration

**Check 2: Verify you're configuring the correct client**
- Multi-tenant setup may have separate clients per realm
- Ensure you're updating the client for the realm you're testing
- Example: Testing `audiscope.localhost:3000` → Configure `audiscope-web` client in `audiscope` realm

**Check 3: Clear browser cache and cookies**
```bash
# Chrome DevTools Console
document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
localStorage.clear();
sessionStorage.clear();
```

**Check 4: Verify NEXTAUTH_URL environment variable**
```bash
# In your .env.dev-cloud or .env.local
NEXTAUTH_URL=http://audiscope.localhost:3000
```

This should match the subdomain you're accessing.

### CORS Errors

If you see CORS-related errors in the browser console:

1. Verify **Web Origins** in Keycloak includes your domain
2. Ensure no trailing slashes in Web Origins
3. Restart your development server after Keycloak changes

### Session Issues

If authentication succeeds but session doesn't persist:

1. Check **Session Idle** and **Session Max** settings in Keycloak realm settings
2. Verify **Client Session Idle** and **Client Session Max** in client settings
3. Clear browser cookies and try again

## Environment Variables Reference

From your `.env.dev-cloud`:

```bash
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=audiscope
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=audiscope-web

# NextAuth Configuration
NEXTAUTH_URL=http://audiscope.localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Server-side Keycloak credentials
KEYCLOAK_CLIENT_SECRET=your-client-secret-here
KEYCLOAK_ISSUER=http://localhost:8080/realms/audiscope
```

**Important:** For multi-tenant setup, each tenant subdomain should have its environment properly configured.

## Security Considerations

### Production Setup

1. **Use HTTPS:** Always use HTTPS in production
2. **Specific URLs:** Avoid wildcards; list exact redirect URIs
3. **Realm Isolation:** Keep tenant realms separate for security
4. **Client Secrets:** Use different secrets per client
5. **Token Lifetimes:** Configure appropriate session timeouts
6. **PKCE:** Ensure PKCE is enabled for public clients

### Development Setup

1. **Localhost Only:** Restrict development clients to localhost
2. **Separate Clients:** Use different clients for dev vs prod
3. **Secret Management:** Never commit secrets to git

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/docs/latest/server_admin/)
- [NextAuth.js Keycloak Provider](https://next-auth.js.org/providers/keycloak)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Support

If you continue to experience issues after following this guide:

1. Check Keycloak server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure Keycloak and AudiScope versions are compatible
4. Review the NextAuth configuration in `lib/auth.ts`

## Checklist

Use this checklist to ensure proper configuration:

- [ ] Identified all tenant subdomains in `lib/tenant/tenant-config.ts`
- [ ] Accessed Keycloak Admin Console
- [ ] Selected correct realm for each tenant
- [ ] Added all redirect URIs to client configuration
- [ ] Added all post-logout redirect URIs
- [ ] Added all web origins for CORS
- [ ] Saved client configuration
- [ ] Verified settings persisted
- [ ] Tested login from base domain (`localhost:3000`)
- [ ] Tested login from each tenant subdomain
- [ ] Tested logout functionality
- [ ] Verified no console errors
- [ ] Cleared browser cache/cookies if needed
- [ ] Documented any custom configurations

---

**Document Version:** 1.0
**Last Updated:** 2026-01-20
**Applies to:** AudiScope v1.x with Keycloak multi-tenant architecture
