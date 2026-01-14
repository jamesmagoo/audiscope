"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { TenantConfig, TenantService } from '@/lib/tenant/tenant-config'
import Cookies from 'js-cookie'

interface TenantContextType {
  tenant: TenantConfig | null
  loading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

/**
 * useTenant Hook
 *
 * Access current tenant configuration from any component
 *
 * @example
 * const { tenant, loading } = useTenant()
 * if (tenant) {
 *   console.log(tenant.branding.appName)
 * }
 */
export const useTenant = () => {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

/**
 * TenantProvider Component
 *
 * Provides tenant context to the entire application.
 * Reads tenant from cookie (set by middleware) and loads configuration.
 *
 * @example
 * <TenantProvider>
 *   <App />
 * </TenantProvider>
 */
export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read tenant from cookie (set by middleware)
    const tenantSubdomain = Cookies.get('tenant')

    if (tenantSubdomain) {
      const tenantConfig = TenantService.getTenantConfig(tenantSubdomain)
      setTenant(tenantConfig)
    } else {
      // Fallback: try to resolve from current hostname
      if (typeof window !== 'undefined') {
        const subdomain = TenantService.getTenantFromHostname(window.location.hostname)
        if (subdomain) {
          const tenantConfig = TenantService.getTenantConfig(subdomain)
          setTenant(tenantConfig)
        }
      }
    }

    setLoading(false)
  }, [])

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  )
}
