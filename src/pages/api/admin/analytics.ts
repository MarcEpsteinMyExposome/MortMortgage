import { prisma } from '../../../lib/prisma'
import { withAuth } from '../../../lib/auth'

interface AnalyticsResponse {
  summary: {
    totalApplications: number
    thisMonth: number
    approvalRate: number
    avgLoanAmount: number
  }
  volumeByMonth: Array<{ month: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
  loanTypeBreakdown: Array<{ type: string; count: number; avgAmount: number }>
  propertyTypeBreakdown: Array<{ type: string; count: number }>
  recentActivity: Array<{ appId: string; timestamp: string; change: string }>
}

async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // Fetch all applications
    const apps = await prisma.application.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    // Parse JSON data
    const parsedApps = apps.map((app) => ({
      ...app,
      data: JSON.parse(app.data || '{}'),
      borrowers: JSON.parse(app.borrowers || '[]')
    }))

    // Calculate summary metrics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisMonthApps = parsedApps.filter(
      (app) => new Date(app.createdAt) >= startOfMonth
    )

    const decidedApps = parsedApps.filter(
      (app) => app.status === 'approved' || app.status === 'denied'
    )
    const approvedApps = parsedApps.filter((app) => app.status === 'approved')
    const approvalRate = decidedApps.length > 0
      ? (approvedApps.length / decidedApps.length) * 100
      : 0

    const loanAmounts = parsedApps
      .map((app) => app.data?.loan?.loanAmount || 0)
      .filter((amount) => amount > 0)
    const avgLoanAmount = loanAmounts.length > 0
      ? loanAmounts.reduce((sum, amt) => sum + amt, 0) / loanAmounts.length
      : 0

    // Volume by month (last 6 months)
    const volumeByMonth: Array<{ month: string; count: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const count = parsedApps.filter((app) => {
        const created = new Date(app.createdAt)
        return created >= date && created <= monthEnd
      }).length
      volumeByMonth.push({ month: monthName, count })
    }

    // Status distribution
    const statusCounts: Record<string, number> = {}
    parsedApps.forEach((app) => {
      const status = app.status || 'draft'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }))

    // Loan type breakdown
    const loanTypeData: Record<string, { count: number; totalAmount: number }> = {}
    parsedApps.forEach((app) => {
      const loanType = app.data?.loan?.loanType || 'Conventional'
      const amount = app.data?.loan?.loanAmount || 0
      if (!loanTypeData[loanType]) {
        loanTypeData[loanType] = { count: 0, totalAmount: 0 }
      }
      loanTypeData[loanType].count++
      loanTypeData[loanType].totalAmount += amount
    })
    const loanTypeBreakdown = Object.entries(loanTypeData).map(([type, data]) => ({
      type,
      count: data.count,
      avgAmount: data.count > 0 ? Math.round(data.totalAmount / data.count) : 0
    }))

    // Property type breakdown
    const propertyTypeCounts: Record<string, number> = {}
    parsedApps.forEach((app) => {
      const propertyType = app.data?.property?.propertyType || 'unknown'
      propertyTypeCounts[propertyType] = (propertyTypeCounts[propertyType] || 0) + 1
    })
    const propertyTypeBreakdown = Object.entries(propertyTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    // Recent activity (last 10 status changes - simulated based on updatedAt)
    const recentActivity = parsedApps
      .slice(0, 10)
      .map((app) => {
        const borrower = app.borrowers?.[0]
        const name = borrower?.name
          ? `${borrower.name.firstName || ''} ${borrower.name.lastName || ''}`.trim()
          : 'Unknown'
        return {
          appId: app.id.slice(0, 8),
          timestamp: app.updatedAt.toISOString(),
          change: `${name}: Status is now "${app.status}"`
        }
      })

    const response: AnalyticsResponse = {
      summary: {
        totalApplications: parsedApps.length,
        thisMonth: thisMonthApps.length,
        approvalRate: Math.round(approvalRate * 10) / 10,
        avgLoanAmount: Math.round(avgLoanAmount)
      },
      volumeByMonth,
      statusDistribution,
      loanTypeBreakdown,
      propertyTypeBreakdown,
      recentActivity
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Analytics API error:', error)
    return res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}

export default withAuth(handler, 'ADMIN')
