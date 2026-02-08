import { PrismaClient } from '@prisma/client'
import { withAuth } from '../../../lib/auth'

const prisma = new PrismaClient()

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const allAssigned = await prisma.application.findMany({
    where: { assignedToId: user.id }
  })

  const active = allAssigned.filter(a => !['approved', 'denied'].includes(a.status))
  const completed = allAssigned.filter(a => ['approved', 'denied'].includes(a.status))
  const approved = allAssigned.filter(a => a.status === 'approved')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = completed.filter(a => new Date(a.updatedAt) >= startOfMonth)

  // Avg days to decision (from assignedAt to updatedAt for completed)
  const daysToDecision = completed
    .filter(a => a.assignedAt)
    .map(a => {
      const assigned = new Date(a.assignedAt!).getTime()
      const decided = new Date(a.updatedAt).getTime()
      return (decided - assigned) / (1000 * 60 * 60 * 24)
    })
  const avgDays = daysToDecision.length > 0
    ? Math.round(daysToDecision.reduce((s, d) => s + d, 0) / daysToDecision.length * 10) / 10
    : 0

  const approvalRate = completed.length > 0
    ? Math.round((approved.length / completed.length) * 1000) / 10
    : 0

  return res.status(200).json({
    queueCount: active.length,
    completedThisMonth: completedThisMonth.length,
    completedTotal: completed.length,
    avgDaysToDecision: avgDays,
    approvalRate
  })
}

export default withAuth(handler, 'CASEWORKER')
