/**
 * Tests for caseworker queue sorting logic and priority/SLA computation
 */

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

function sortQueue(apps: any[]): any[] {
  return [...apps].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2
    const pb = PRIORITY_ORDER[b.priority] ?? 2
    if (pa !== pb) return pa - pb

    const now = Date.now()
    const aOverdue = a.slaDeadline && new Date(a.slaDeadline).getTime() < now ? 1 : 0
    const bOverdue = b.slaDeadline && new Date(b.slaDeadline).getTime() < now ? 1 : 0
    if (aOverdue !== bOverdue) return bOverdue - aOverdue

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function getSLAStatus(deadline: string | null): 'overdue' | 'at_risk' | 'on_track' | 'none' {
  if (!deadline) return 'none'
  const now = new Date()
  const sla = new Date(deadline)
  const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursLeft < 0) return 'overdue'
  if (hoursLeft < 24) return 'at_risk'
  return 'on_track'
}

function calculateApprovalRate(approved: number, denied: number): number {
  const total = approved + denied
  return total > 0 ? Math.round((approved / total) * 1000) / 10 : 0
}

function calculateAvgDays(apps: Array<{ assignedAt: string; decidedAt: string }>): number {
  if (apps.length === 0) return 0
  const days = apps.map(a => {
    const assigned = new Date(a.assignedAt).getTime()
    const decided = new Date(a.decidedAt).getTime()
    return (decided - assigned) / (1000 * 60 * 60 * 24)
  })
  return Math.round(days.reduce((s, d) => s + d, 0) / days.length * 10) / 10
}

describe('Caseworker Queue Sorting', () => {
  it('sorts urgent before normal priority', () => {
    const apps = [
      { id: '1', priority: 'normal', slaDeadline: null, createdAt: '2025-01-01' },
      { id: '2', priority: 'urgent', slaDeadline: null, createdAt: '2025-01-02' }
    ]
    const sorted = sortQueue(apps)
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
  })

  it('sorts high before normal but after urgent', () => {
    const apps = [
      { id: '1', priority: 'normal', slaDeadline: null, createdAt: '2025-01-01' },
      { id: '2', priority: 'high', slaDeadline: null, createdAt: '2025-01-01' },
      { id: '3', priority: 'urgent', slaDeadline: null, createdAt: '2025-01-01' }
    ]
    const sorted = sortQueue(apps)
    expect(sorted.map(a => a.id)).toEqual(['3', '2', '1'])
  })

  it('sorts low priority last', () => {
    const apps = [
      { id: '1', priority: 'low', slaDeadline: null, createdAt: '2025-01-01' },
      { id: '2', priority: 'normal', slaDeadline: null, createdAt: '2025-01-01' },
      { id: '3', priority: 'high', slaDeadline: null, createdAt: '2025-01-01' }
    ]
    const sorted = sortQueue(apps)
    expect(sorted[2].id).toBe('1')
  })

  it('puts overdue SLA apps before on-track when same priority', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString()
    const apps = [
      { id: '1', priority: 'normal', slaDeadline: futureDate, createdAt: '2025-01-01' },
      { id: '2', priority: 'normal', slaDeadline: pastDate, createdAt: '2025-01-02' }
    ]
    const sorted = sortQueue(apps)
    expect(sorted[0].id).toBe('2')
  })

  it('sorts oldest first when same priority and SLA status', () => {
    const apps = [
      { id: '1', priority: 'normal', slaDeadline: null, createdAt: '2025-01-10' },
      { id: '2', priority: 'normal', slaDeadline: null, createdAt: '2025-01-01' },
      { id: '3', priority: 'normal', slaDeadline: null, createdAt: '2025-01-05' }
    ]
    const sorted = sortQueue(apps)
    expect(sorted.map(a => a.id)).toEqual(['2', '3', '1'])
  })

  it('handles empty queue', () => {
    const sorted = sortQueue([])
    expect(sorted).toEqual([])
  })

  it('handles single app', () => {
    const apps = [{ id: '1', priority: 'normal', slaDeadline: null, createdAt: '2025-01-01' }]
    const sorted = sortQueue(apps)
    expect(sorted.length).toBe(1)
    expect(sorted[0].id).toBe('1')
  })

  it('complex sort with mixed priorities and SLAs', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString()
    const apps = [
      { id: 'normal-old', priority: 'normal', slaDeadline: null, createdAt: '2025-01-01' },
      { id: 'normal-overdue', priority: 'normal', slaDeadline: pastDate, createdAt: '2025-01-05' },
      { id: 'urgent-new', priority: 'urgent', slaDeadline: futureDate, createdAt: '2025-01-10' },
      { id: 'high-mid', priority: 'high', slaDeadline: null, createdAt: '2025-01-03' },
      { id: 'low-old', priority: 'low', slaDeadline: null, createdAt: '2024-12-01' }
    ]
    const sorted = sortQueue(apps)
    // Urgent first, then high, then normal (overdue before on-track), then low
    expect(sorted[0].id).toBe('urgent-new')
    expect(sorted[1].id).toBe('high-mid')
    expect(sorted[2].id).toBe('normal-overdue')
    expect(sorted[3].id).toBe('normal-old')
    expect(sorted[4].id).toBe('low-old')
  })
})

describe('SLA Status Calculation', () => {
  it('returns "none" for null deadline', () => {
    expect(getSLAStatus(null)).toBe('none')
  })

  it('returns "overdue" for past deadline', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    expect(getSLAStatus(past)).toBe('overdue')
  })

  it('returns "at_risk" for deadline within 24 hours', () => {
    const soon = new Date(Date.now() + 12 * 3600000).toISOString()
    expect(getSLAStatus(soon)).toBe('at_risk')
  })

  it('returns "on_track" for deadline more than 24 hours away', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString()
    expect(getSLAStatus(future)).toBe('on_track')
  })
})

describe('Analytics Computations', () => {
  describe('Approval Rate', () => {
    it('calculates approval rate correctly', () => {
      expect(calculateApprovalRate(9, 1)).toBe(90)
    })

    it('returns 0 when no decisions', () => {
      expect(calculateApprovalRate(0, 0)).toBe(0)
    })

    it('handles 100% approval', () => {
      expect(calculateApprovalRate(10, 0)).toBe(100)
    })

    it('handles 0% approval', () => {
      expect(calculateApprovalRate(0, 5)).toBe(0)
    })

    it('rounds to one decimal', () => {
      expect(calculateApprovalRate(2, 1)).toBe(66.7)
    })
  })

  describe('Average Days to Decision', () => {
    it('calculates average correctly', () => {
      const apps = [
        { assignedAt: '2025-01-01', decidedAt: '2025-01-11' }, // 10 days
        { assignedAt: '2025-01-01', decidedAt: '2025-01-21' }  // 20 days
      ]
      expect(calculateAvgDays(apps)).toBe(15)
    })

    it('returns 0 for empty array', () => {
      expect(calculateAvgDays([])).toBe(0)
    })

    it('handles single entry', () => {
      const apps = [
        { assignedAt: '2025-01-01', decidedAt: '2025-01-08' } // 7 days
      ]
      expect(calculateAvgDays(apps)).toBe(7)
    })
  })

  describe('LTV Calculation', () => {
    function calculateLTV(loanAmount: number, propertyValue: number): number {
      if (propertyValue === 0) return 0
      return Math.round((loanAmount / propertyValue) * 1000) / 10
    }

    it('calculates standard LTV', () => {
      expect(calculateLTV(320000, 400000)).toBe(80)
    })

    it('returns 0 for zero property value', () => {
      expect(calculateLTV(320000, 0)).toBe(0)
    })

    it('calculates high LTV', () => {
      expect(calculateLTV(380000, 400000)).toBe(95)
    })

    it('calculates low LTV', () => {
      expect(calculateLTV(200000, 400000)).toBe(50)
    })
  })

  describe('DTI Calculation', () => {
    function calculateDTI(monthlyDebt: number, monthlyIncome: number): number {
      if (monthlyIncome === 0) return 0
      return Math.round((monthlyDebt / monthlyIncome) * 1000) / 10
    }

    it('calculates standard DTI', () => {
      expect(calculateDTI(2000, 8000)).toBe(25)
    })

    it('returns 0 for zero income', () => {
      expect(calculateDTI(2000, 0)).toBe(0)
    })

    it('identifies high DTI', () => {
      const dti = calculateDTI(4500, 8000)
      expect(dti).toBe(56.3)
      expect(dti).toBeGreaterThan(43)
    })
  })
})

describe('Priority Badge Logic', () => {
  const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    urgent: { color: 'red', label: 'Urgent' },
    high: { color: 'orange', label: 'High' },
    normal: { color: 'blue', label: 'Normal' },
    low: { color: 'gray', label: 'Low' }
  }

  it('maps priority to correct configuration', () => {
    expect(PRIORITY_CONFIG['urgent'].color).toBe('red')
    expect(PRIORITY_CONFIG['high'].color).toBe('orange')
    expect(PRIORITY_CONFIG['normal'].color).toBe('blue')
    expect(PRIORITY_CONFIG['low'].color).toBe('gray')
  })

  it('has labels for all priorities', () => {
    for (const key of ['urgent', 'high', 'normal', 'low']) {
      expect(PRIORITY_CONFIG[key].label).toBeDefined()
    }
  })
})

describe('Role Hierarchy', () => {
  const ROLE_HIERARCHY: Record<string, number> = {
    BORROWER: 0,
    CASEWORKER: 1,
    ADMIN: 2,
    SUPERVISOR: 3
  }

  function hasRole(userRole: string, requiredRole: string): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
    return userLevel >= requiredLevel
  }

  it('SUPERVISOR has access to ADMIN resources', () => {
    expect(hasRole('SUPERVISOR', 'ADMIN')).toBe(true)
  })

  it('SUPERVISOR has access to CASEWORKER resources', () => {
    expect(hasRole('SUPERVISOR', 'CASEWORKER')).toBe(true)
  })

  it('ADMIN has access to CASEWORKER resources', () => {
    expect(hasRole('ADMIN', 'CASEWORKER')).toBe(true)
  })

  it('CASEWORKER does not have access to ADMIN resources', () => {
    expect(hasRole('CASEWORKER', 'ADMIN')).toBe(false)
  })

  it('BORROWER does not have access to CASEWORKER resources', () => {
    expect(hasRole('BORROWER', 'CASEWORKER')).toBe(false)
  })

  it('BORROWER has access to BORROWER resources', () => {
    expect(hasRole('BORROWER', 'BORROWER')).toBe(true)
  })
})
