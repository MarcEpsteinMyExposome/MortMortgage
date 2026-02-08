import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export type UserRole = 'BORROWER' | 'CASEWORKER' | 'ADMIN' | 'SUPERVISOR'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  BORROWER: 0,
  CASEWORKER: 1,
  ADMIN: 2,
  SUPERVISOR: 3
}

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

/**
 * Get the current session on the server side
 */
export async function getSession(req: any, res: any) {
  return await getServerSession(req, res, authOptions)
}

/**
 * Check if user has required role (respects hierarchy)
 */
export function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
  if (!user) return false
  const userLevel = ROLE_HIERARCHY[user.role] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return userLevel >= requiredLevel
}

/**
 * Check if user is exactly one of the specified roles
 */
export function isRole(user: AuthUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * API route protection middleware
 */
export function withAuth(
  handler: (req: any, res: any, user: AuthUser) => Promise<void>,
  requiredRole?: UserRole
) {
  return async (req: any, res: any) => {
    const session = await getSession(req, res)

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = session.user as AuthUser

    if (requiredRole && !hasRole(user, requiredRole)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return handler(req, res, user)
  }
}
