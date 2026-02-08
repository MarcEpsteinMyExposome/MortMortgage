import { PrismaClient } from '@prisma/client'
import { withAuth, isRole } from '../../../lib/auth'

const prisma = new PrismaClient()

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  if (!isRole(user, 'SUPERVISOR', 'ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const allApps = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const parsedApps = allApps.map((app: any) => ({
    ...app,
    data: JSON.parse(app.data || '{}'),
    borrowers: JSON.parse(app.borrowers || '[]')
  }))

  const caseworkers = await prisma.user.findMany({
    where: { role: 'CASEWORKER' },
    orderBy: { name: 'asc' }
  })

  const now = new Date()

  // Overview stats
  const openApps = parsedApps.filter(a => !['approved', 'denied', 'draft'].includes(a.status))
  const unassignedApps = openApps.filter(a => !a.assignedToId)
  const overdueApps = openApps.filter(a => a.slaDeadline && new Date(a.slaDeadline) < now)
  const decidedApps = parsedApps.filter(a => a.status === 'approved' || a.status === 'denied')
  const approvedApps = parsedApps.filter(a => a.status === 'approved')
  const teamApprovalRate = decidedApps.length > 0
    ? Math.round((approvedApps.length / decidedApps.length) * 1000) / 10
    : 0

  // Avg days to decision
  const daysArr = decidedApps
    .filter(a => a.assignedAt)
    .map(a => (new Date(a.updatedAt).getTime() - new Date(a.assignedAt!).getTime()) / 86400000)
  const avgDays = daysArr.length > 0
    ? Math.round(daysArr.reduce((s, d) => s + d, 0) / daysArr.length * 10) / 10
    : 0

  // Workload distribution
  const workload = await Promise.all(caseworkers.map(async (cw) => {
    const active = await prisma.application.count({
      where: {
        assignedToId: cw.id,
        status: { notIn: ['approved', 'denied'] }
      }
    })
    const completed = await prisma.application.count({
      where: {
        assignedToId: cw.id,
        status: { in: ['approved', 'denied'] }
      }
    })
    const approvedCw = await prisma.application.count({
      where: { assignedToId: cw.id, status: 'approved' }
    })

    // Find oldest active app
    const oldestApp = await prisma.application.findFirst({
      where: {
        assignedToId: cw.id,
        status: { notIn: ['approved', 'denied'] }
      },
      orderBy: { createdAt: 'asc' }
    })

    const cwDecided = parsedApps.filter(a => a.assignedToId === cw.id && ['approved', 'denied'].includes(a.status))
    const cwDays = cwDecided
      .filter(a => a.assignedAt)
      .map(a => (new Date(a.updatedAt).getTime() - new Date(a.assignedAt!).getTime()) / 86400000)
    const cwAvgDays = cwDays.length > 0
      ? Math.round(cwDays.reduce((s, d) => s + d, 0) / cwDays.length * 10) / 10
      : 0

    return {
      id: cw.id,
      name: cw.name,
      active: cw.active,
      activeQueue: active,
      completed,
      approvalRate: completed > 0 ? Math.round((approvedCw / completed) * 1000) / 10 : 0,
      avgDaysToDecision: cwAvgDays,
      oldestAppDate: oldestApp?.createdAt || null
    }
  }))

  // LTV analysis
  const ltvRanges = ['0-60', '60-70', '70-80', '80-90', '90-95', '95+']
  const ltvAnalysis = ltvRanges.map(range => {
    const [min, max] = range.includes('+')
      ? [parseInt(range), 999]
      : range.split('-').map(Number)

    const inRange = parsedApps.filter(a => {
      const loanAmt = a.data?.loan?.loanAmount || 0
      const propVal = a.data?.property?.propertyValue || 0
      if (propVal === 0) return false
      const ltv = (loanAmt / propVal) * 100
      return ltv >= min && ltv < max
    })

    const rangeApproved = inRange.filter(a => a.status === 'approved').length
    const rangeDenied = inRange.filter(a => a.status === 'denied').length

    return {
      range,
      total: inRange.length,
      approved: rangeApproved,
      denied: rangeDenied,
      approvalRate: (rangeApproved + rangeDenied) > 0
        ? Math.round((rangeApproved / (rangeApproved + rangeDenied)) * 1000) / 10
        : 0
    }
  })

  // DTI analysis
  const dtiRanges = ['0-28', '28-36', '36-43', '43-50', '50+']
  const dtiAnalysis = dtiRanges.map(range => {
    const [min, max] = range.includes('+')
      ? [parseInt(range), 999]
      : range.split('-').map(Number)

    const inRange = parsedApps.filter(a => {
      const liabilities = a.data?.liabilities?.liabilities || []
      const incomeSources = a.data?.incomeSources?.sources || a.borrowers?.[0]?.employment || []
      const monthlyDebt = liabilities.reduce((s: number, l: any) => s + (l.monthlyPayment || 0), 0)
      const monthlyIncome = Array.isArray(incomeSources)
        ? incomeSources.reduce((s: number, src: any) => s + (src.monthlyIncome || src.amount || 0), 0)
        : 0
      if (monthlyIncome === 0) return false
      const dti = (monthlyDebt / monthlyIncome) * 100
      return dti >= min && dti < max
    })

    const rangeApproved = inRange.filter(a => a.status === 'approved').length
    const rangeDenied = inRange.filter(a => a.status === 'denied').length

    return {
      range,
      total: inRange.length,
      approved: rangeApproved,
      denied: rangeDenied,
      approvalRate: (rangeApproved + rangeDenied) > 0
        ? Math.round((rangeApproved / (rangeApproved + rangeDenied)) * 1000) / 10
        : 0
    }
  })

  // Performance trend (6 months)
  const performanceTrend = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    const monthData: any = { month: monthLabel }
    for (const cw of caseworkers) {
      const cwCompleted = parsedApps.filter(a =>
        a.assignedToId === cw.id &&
        ['approved', 'denied'].includes(a.status) &&
        new Date(a.updatedAt) >= monthStart &&
        new Date(a.updatedAt) <= monthEnd
      ).length
      monthData[cw.name || cw.id] = cwCompleted
    }
    performanceTrend.push(monthData)
  }

  // Recent assignment activity
  const recentAssignments = await prisma.assignment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      assignedTo: { select: { name: true } },
      assignedByUser: { select: { name: true } },
      application: { select: { id: true, borrowers: true } }
    }
  })

  const recentActivity = recentAssignments.map(a => {
    const borrowers = JSON.parse(a.application.borrowers || '[]')
    const borrowerName = borrowers[0]?.name
      ? `${borrowers[0].name.firstName || ''} ${borrowers[0].name.lastName || ''}`.trim()
      : a.application.id.slice(0, 8)

    return {
      id: a.id,
      action: a.action,
      appId: a.application.id.slice(0, 8),
      borrowerName,
      caseworkerName: a.assignedTo.name,
      assignedByName: a.assignedByUser.name,
      note: a.note,
      createdAt: a.createdAt.toISOString()
    }
  })

  return res.status(200).json({
    overview: {
      totalOpen: openApps.length,
      unassigned: unassignedApps.length,
      overdue: overdueApps.length,
      teamApprovalRate,
      avgDaysToDecision: avgDays
    },
    workload,
    ltvAnalysis,
    dtiAnalysis,
    performanceTrend,
    caseworkerNames: caseworkers.map(c => c.name || c.id),
    recentActivity
  })
}

export default withAuth(handler, 'CASEWORKER')
