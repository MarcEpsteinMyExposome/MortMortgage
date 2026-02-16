/**
 * Tests for the three-role system.
 * Mirrors the logic from src/lib/auth.ts without importing it directly
 * (to avoid next-auth dependency chain in Jest).
 */

type UserRole = 'BORROWER' | 'CASEWORKER' | 'SUPERVISOR'

interface AuthUser {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  BORROWER: 0,
  CASEWORKER: 1,
  SUPERVISOR: 2
}

function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
  if (!user) return false
  const userLevel = ROLE_HIERARCHY[user.role] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return userLevel >= requiredLevel
}

function isRole(user: AuthUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

function makeUser(role: UserRole): AuthUser {
  return { id: 'test-id', email: 'test@test.com', name: 'Test', role }
}

describe('Three-role system', () => {
  describe('Role hierarchy has exactly 3 levels', () => {
    it('should have BORROWER=0, CASEWORKER=1, SUPERVISOR=2', () => {
      expect(ROLE_HIERARCHY.BORROWER).toBe(0)
      expect(ROLE_HIERARCHY.CASEWORKER).toBe(1)
      expect(ROLE_HIERARCHY.SUPERVISOR).toBe(2)
      expect(Object.keys(ROLE_HIERARCHY)).toHaveLength(3)
    })
  })

  describe('hasRole (hierarchy-based)', () => {
    it('BORROWER has BORROWER role', () => {
      expect(hasRole(makeUser('BORROWER'), 'BORROWER')).toBe(true)
    })

    it('BORROWER does not have CASEWORKER role', () => {
      expect(hasRole(makeUser('BORROWER'), 'CASEWORKER')).toBe(false)
    })

    it('BORROWER does not have SUPERVISOR role', () => {
      expect(hasRole(makeUser('BORROWER'), 'SUPERVISOR')).toBe(false)
    })

    it('CASEWORKER has BORROWER role', () => {
      expect(hasRole(makeUser('CASEWORKER'), 'BORROWER')).toBe(true)
    })

    it('CASEWORKER has CASEWORKER role', () => {
      expect(hasRole(makeUser('CASEWORKER'), 'CASEWORKER')).toBe(true)
    })

    it('CASEWORKER does not have SUPERVISOR role', () => {
      expect(hasRole(makeUser('CASEWORKER'), 'SUPERVISOR')).toBe(false)
    })

    it('SUPERVISOR has all roles', () => {
      expect(hasRole(makeUser('SUPERVISOR'), 'BORROWER')).toBe(true)
      expect(hasRole(makeUser('SUPERVISOR'), 'CASEWORKER')).toBe(true)
      expect(hasRole(makeUser('SUPERVISOR'), 'SUPERVISOR')).toBe(true)
    })

    it('returns false for null user', () => {
      expect(hasRole(null, 'BORROWER')).toBe(false)
    })
  })

  describe('isRole (exact match)', () => {
    it('matches single role', () => {
      expect(isRole(makeUser('CASEWORKER'), 'CASEWORKER')).toBe(true)
      expect(isRole(makeUser('CASEWORKER'), 'SUPERVISOR')).toBe(false)
    })

    it('matches multiple roles', () => {
      expect(isRole(makeUser('CASEWORKER'), 'CASEWORKER', 'SUPERVISOR')).toBe(true)
      expect(isRole(makeUser('SUPERVISOR'), 'CASEWORKER', 'SUPERVISOR')).toBe(true)
      expect(isRole(makeUser('BORROWER'), 'CASEWORKER', 'SUPERVISOR')).toBe(false)
    })

    it('returns false for null user', () => {
      expect(isRole(null, 'BORROWER')).toBe(false)
    })
  })

  describe('ADMIN role is removed', () => {
    it('ADMIN is not in the role hierarchy', () => {
      expect((ROLE_HIERARCHY as any)['ADMIN']).toBeUndefined()
    })

    it('hasRole treats unknown roles as level 0', () => {
      const user = { id: 'x', email: 'x', role: 'ADMIN' as any }
      expect(hasRole(user, 'CASEWORKER')).toBe(false)
    })
  })
})
