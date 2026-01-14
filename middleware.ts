export { auth as middleware } from "@/app/api/auth/[...nextauth]/route"

// Protect all dashboard routes and API routes except auth endpoints
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    // Exclude NextAuth API routes from middleware
    '/((?!api/auth).*)',
  ]
}
