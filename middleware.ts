import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/app/api/auth/[...nextauth]/route"
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

  // Public routes that don't require tenant validation
  const publicRoutes = ['/', '/api/auth', '/api/health']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Static assets that don't require tenant validation
  const isStaticAsset = pathname.startsWith('/_next') ||
                        pathname.startsWith('/favicon') ||
                        pathname.startsWith('/icon') ||
                        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)

  // Extract tenant from hostname
  const tenantSubdomain = TenantService.getTenantFromHostname(hostname)

  // Skip tenant validation for public routes and static assets
  if (!isPublicRoute && !isStaticAsset) {
    // Validate tenant for protected routes
    if (!tenantSubdomain || !TenantService.isValidTenant(tenantSubdomain)) {
      console.warn(`Invalid tenant: ${tenantSubdomain} from hostname: ${hostname}`)
      return NextResponse.redirect(new URL('/tenant-not-found', request.url))
    }

    // Get tenant configuration
    const tenantConfig = TenantService.getTenantConfig(tenantSubdomain)

    if (!tenantConfig) {
      console.error(`Tenant config not found for: ${tenantSubdomain}`)
      return NextResponse.redirect(new URL('/tenant-not-found', request.url))
    }

    // Run NextAuth authentication check
    const session = await auth()

    // Check if accessing protected routes
    const isProtectedRoute = pathname.startsWith('/dashboard')

    if (isProtectedRoute && !session) {
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

  // For public routes, just set tenant cookie if available
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
