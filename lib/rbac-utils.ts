/**
 * AUTH - Role-Based Access Control (RBAC) Utilities
 *
 * Utilities for checking user roles and permissions.
 * Designed to work with Keycloak multi-role system.
 *
 * Role hierarchy (from core-api/internal/modules/auth/ROLES.md):
 * - owner: Organization owner (billing, subscription, org settings)
 * - admin: Organization administrator (user management, full org access)
 * - manager: Team manager (team oversight, reporting, approvals)
 * - editor: Content editor (create/edit content, products)
 * - user: Standard user (base level access, default)
 * - viewer: Read-only access (stakeholders, auditors, guests)
 */

export interface UserWithRoles {
  roles?: string[]
}

/**
 * Check if user has a specific role
 * @param user - User object with roles array
 * @param role - Role to check for
 * @returns true if user has the role, false otherwise
 */
export function hasRole(user: UserWithRoles | null | undefined, role: string): boolean {
  return user?.roles?.includes(role) ?? false
}

/**
 * Check if user has ANY of the specified roles
 * @param user - User object with roles array
 * @param roles - Array of roles to check
 * @returns true if user has at least one of the roles, false otherwise
 */
export function hasAnyRole(user: UserWithRoles | null | undefined, roles: string[]): boolean {
  if (!user?.roles || roles.length === 0) return false
  return roles.some(role => user.roles!.includes(role))
}

/**
 * Check if user has ALL of the specified roles
 * @param user - User object with roles array
 * @param roles - Array of roles to check
 * @returns true if user has all specified roles, false otherwise
 */
export function hasAllRoles(user: UserWithRoles | null | undefined, roles: string[]): boolean {
  if (!user?.roles || roles.length === 0) return false
  return roles.every(role => user.roles!.includes(role))
}

/**
 * Standard role constants for type safety
 */
export const Role = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EDITOR: 'editor',
  USER: 'user',
  VIEWER: 'viewer',
} as const

export type RoleType = typeof Role[keyof typeof Role]

/**
 * Role hierarchy levels (higher number = more permissions)
 * Useful for permission checks like "must be at least a manager"
 */
export const RoleLevel: Record<RoleType, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  editor: 2,
  user: 1,
  viewer: 0,
}

/**
 * Check if user has a role with at least the specified level
 * @param user - User object with roles array
 * @param minLevel - Minimum role level required
 * @returns true if user has a role with sufficient level, false otherwise
 */
export function hasRoleLevel(user: UserWithRoles | null | undefined, minLevel: number): boolean {
  if (!user?.roles) return false

  return user.roles.some(role => {
    const level = RoleLevel[role as RoleType]
    return level !== undefined && level >= minLevel
  })
}

/**
 * Check if user is an owner or admin (highest access levels)
 */
export function isOwnerOrAdmin(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, [Role.OWNER, Role.ADMIN])
}

/**
 * Check if user can manage content (owner, admin, or editor)
 */
export function canManageContent(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, [Role.OWNER, Role.ADMIN, Role.EDITOR])
}

/**
 * Check if user can manage team members (owner, admin, or manager)
 */
export function canManageTeam(user: UserWithRoles | null | undefined): boolean {
  return hasAnyRole(user, [Role.OWNER, Role.ADMIN, Role.MANAGER])
}

/**
 * Get the highest role level for a user
 * @param user - User object with roles array
 * @returns highest role level, or -1 if user has no roles
 */
export function getHighestRoleLevel(user: UserWithRoles | null | undefined): number {
  if (!user?.roles || user.roles.length === 0) return -1

  return Math.max(
    ...user.roles.map(role => RoleLevel[role as RoleType] ?? -1)
  )
}

/**
 * Get user's roles sorted by level (highest to lowest)
 * @param user - User object with roles array
 * @returns Array of roles sorted by level
 */
export function getSortedRoles(user: UserWithRoles | null | undefined): string[] {
  if (!user?.roles) return []

  return [...user.roles].sort((a, b) => {
    const levelA = RoleLevel[a as RoleType] ?? -1
    const levelB = RoleLevel[b as RoleType] ?? -1
    return levelB - levelA // Descending order
  })
}
