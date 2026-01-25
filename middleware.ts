import { NextRequest, NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { TenantService } from '@/lib/tenant/tenant-config'

/**
 * Enhanced Middleware with Tenant Resolution
 *
 * 1. Extracts tenant from hostname
 * 2. Validates tenant exists
 * 3. Injects tenant context into request headers and cookies
 * 4. Handles authentication via NextAuth
 */
export default async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // CRITICAL: Skip all NextAuth routes immediately to prevent infinite loops
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Public routes that don't require tenant validation
  const publicRoutes = ['/', '/api/health']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Static assets that don't require tenant validation
  const isStaticAsset = pathname.startsWith('/_next') ||
                        pathname.startsWith('/favicon') ||
                        pathname.startsWith('/icon') ||
                        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)

  // Extract tenant from hostname
  const tenantSubdomain = TenantService.getTenantFromHostname(hostname)

  // Early return for static assets - skip all processing
  if (isStaticAsset) {
    return NextResponse.next()
  }

  // For public routes, set tenant cookie if available but don't enforce validation
  if (isPublicRoute) {
    if (tenantSubdomain && TenantService.isValidTenant(tenantSubdomain)) {
      const response = NextResponse.next()
      response.cookies.set('tenant', tenantSubdomain, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/'
      })
      return response
    }
    return NextResponse.next()
  }

  // Validate tenant exists
  if (!tenantSubdomain || !TenantService.isValidTenant(tenantSubdomain)) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url))
  }

  // Get tenant configuration
  const tenantConfig = TenantService.getTenantConfig(tenantSubdomain)

  if (!tenantConfig) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url))
  }

  // Run NextAuth authentication check using getToken for middleware
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Check if accessing protected routes
  const isProtectedRoute = pathname.startsWith('/dashboard')

  if (isProtectedRoute && !token) {
    // Redirect to login with tenant context preserved
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)

    // Set tenant cookie before redirect
    response.cookies.set('tenant', tenantConfig.subdomain, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/'
    })

    return response
  }

  // Create response with tenant context
  const response = NextResponse.next()

  // Add tenant to headers (accessible in server components)
  response.headers.set('x-tenant-id', tenantConfig.id)
  response.headers.set('x-tenant-subdomain', tenantConfig.subdomain)

  // Set tenant cookie (accessible in client components)
  response.cookies.set('tenant', tenantConfig.subdomain, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/'
  })

  return response
}

/**
 * Middleware Matcher Configuration
 *
 * Runs middleware on:
 * - All routes except static assets and NextAuth internals
 *
 * Excludes:
 * - _next/static (build artifacts)
 * - _next/image (image optimization)
 * - Static files (favicon, icons, fonts, images)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg (favicons)
     * - Common static file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)).*)',
  ]
}
