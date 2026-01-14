/**
 * Tenant Configuration Service
 *
 * Manages multi-tenant configuration including tenant resolution,
 * Keycloak realm mapping, and branding configuration.
 */

// Tenant configuration interface
export interface TenantConfig {
  id: string                    // Internal tenant ID
  subdomain: string             // customer1, customer2
  keycloakRealm: string         // Keycloak realm name
  keycloakClientId: string      // Tenant-specific or shared client
  keycloakClientSecret: string  // Client secret
  name: string                  // Display name: "Acme Corp"
  branding: {
    logo: string                // URL or path to logo
    primaryColor: string        // Hex color code
    appName: string             // "Acme Learning Portal"
  }
  features: {
    aiAssistant: boolean
    productHub: boolean
    analytics: boolean
  }
  customDomain?: string         // Optional: portal.acme.com
}

// Tenant registry - in production, this could be loaded from database/API
const TENANT_REGISTRY: Record<string, TenantConfig> = {
  'customer1': {
    id: 'customer1',
    subdomain: 'customer1',
    keycloakRealm: 'customer1-realm',
    keycloakClientId: 'customer1-web',
    keycloakClientSecret: process.env.KEYCLOAK_CUSTOMER1_SECRET || process.env.KEYCLOAK_CLIENT_SECRET || '',
    name: 'Acme Medical',
    branding: {
      logo: '/tenants/customer1/logo.svg',
      primaryColor: '#4F46E5',
      appName: 'Acme Learning Portal'
    },
    features: {
      aiAssistant: true,
      productHub: true,
      analytics: true
    }
  },
  'customer2': {
    id: 'customer2',
    subdomain: 'customer2',
    keycloakRealm: 'customer2-realm',
    keycloakClientId: 'customer2-web',
    keycloakClientSecret: process.env.KEYCLOAK_CUSTOMER2_SECRET || process.env.KEYCLOAK_CLIENT_SECRET || '',
    name: 'BioTech Corp',
    branding: {
      logo: '/tenants/customer2/logo.svg',
      primaryColor: '#10B981',
      appName: 'BioTech Training'
    },
    features: {
      aiAssistant: true,
      productHub: false,
      analytics: true
    }
  },
  // Development fallback tenant (uses existing audiscope realm)
  'audiscope': {
    id: 'audiscope',
    subdomain: 'audiscope',
    keycloakRealm: 'audiscope',
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || 'audiscope-web',
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    name: 'Landy AI',
    branding: {
      logo: '/logo.svg',
      primaryColor: '#3B82F6',
      appName: 'Landy AI'
    },
    features: {
      aiAssistant: true,
      productHub: true,
      analytics: true
    }
  }
}

// In-memory cache for tenant configurations
const TENANT_CACHE = new Map<string, TenantConfig>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Tenant Service
 *
 * Provides methods for tenant resolution, validation, and configuration retrieval.
 */
export class TenantService {
  /**
   * Resolve tenant from hostname
   *
   * Examples:
   * - customer1.landy.ai → customer1
   * - customer1.localhost:3000 → customer1
   * - localhost:3000 → audiscope (development fallback)
   * - 127.0.0.1:3000 → audiscope (development fallback)
   */
  static getTenantFromHostname(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0]

    // Extract subdomain
    const parts = host.split('.')

    // Development: localhost or 127.0.0.1
    if (parts.length === 1 || host === 'localhost' || host === '127.0.0.1') {
      // Fallback to env variable for development or default tenant
      return process.env.DEV_TENANT || 'audiscope'
    }

    // Production: customer1.landy.ai or customer1.localhost
    if (parts.length >= 2) {
      const subdomain = parts[0]

      // Ignore 'www' subdomain
      if (subdomain === 'www') {
        return null
      }

      return subdomain
    }

    return null
  }

  /**
   * Get tenant configuration by subdomain
   * Uses in-memory caching for performance
   */
  static getTenantConfig(subdomain: string): TenantConfig | null {
    // Check cache first
    if (TENANT_CACHE.has(subdomain)) {
      return TENANT_CACHE.get(subdomain)!
    }

    // Load from registry
    const config = TENANT_REGISTRY[subdomain]

    if (config) {
      // Store in cache
      TENANT_CACHE.set(subdomain, config)

      // Clear cache after TTL (optional - for production database-backed configs)
      setTimeout(() => {
        TENANT_CACHE.delete(subdomain)
      }, CACHE_TTL)
    }

    return config || null
  }

  /**
   * Validate tenant exists
   */
  static isValidTenant(subdomain: string): boolean {
    return subdomain in TENANT_REGISTRY
  }

  /**
   * Get all tenant subdomains (for admin purposes)
   */
  static getAllTenants(): string[] {
    return Object.keys(TENANT_REGISTRY)
  }

  /**
   * Clear tenant cache (useful for testing or config updates)
   */
  static clearCache(): void {
    TENANT_CACHE.clear()
  }

  /**
   * Add or update tenant configuration dynamically
   * (useful for database-backed tenant management in future)
   */
  static registerTenant(config: TenantConfig): void {
    TENANT_REGISTRY[config.subdomain] = config
    TENANT_CACHE.set(config.subdomain, config)
  }
}
