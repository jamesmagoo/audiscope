/**
 * Simple JWT decoder for debugging
 * Decodes and logs JWT claims to console
 */

export function decodeJWT(token: string): any {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(decodedPayload)

    return claims
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

export function logJWTClaims(token: string) {
  console.log('🔍 JWT Debug - Decoding token...')
  const claims = decodeJWT(token)

  if (claims) {
    console.log('✅ JWT Claims:', claims)
    console.log('📋 User ID (sub):', claims.sub)
    console.log('📧 Email:', claims.email)
    console.log('🏢 Organisation ID:', claims.organisation_id || claims['custom:organisation_id'] || 'NOT FOUND')
    console.log('👤 Role:', claims.role || claims['custom:role'] || 'NOT FOUND')
    console.log('⏰ Expires:', claims.exp ? new Date(claims.exp * 1000).toLocaleString() : 'N/A')
    console.log('📅 Issued:', claims.iat ? new Date(claims.iat * 1000).toLocaleString() : 'N/A')
  }

  return claims
}
