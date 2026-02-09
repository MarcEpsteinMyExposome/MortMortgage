import { prisma } from '../../../lib/prisma'
import { withAuth } from '../../../lib/auth'

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const apps = await prisma.application.findMany({
    where: {
      assignedToId: user.id,
      status: { notIn: ['approved', 'denied'] }
    },
    orderBy: { createdAt: 'asc' }
  })

  const parsed = apps.map((app: any) => ({
    ...app,
    data: JSON.parse(app.data || '{}'),
    borrowers: JSON.parse(app.borrowers || '[]')
  }))

  // Sort: priority (urgent first) → overdue SLA → oldest
  parsed.sort((a: any, b: any) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2
    const pb = PRIORITY_ORDER[b.priority] ?? 2
    if (pa !== pb) return pa - pb

    const now = Date.now()
    const aOverdue = a.slaDeadline && new Date(a.slaDeadline).getTime() < now ? 1 : 0
    const bOverdue = b.slaDeadline && new Date(b.slaDeadline).getTime() < now ? 1 : 0
    if (aOverdue !== bOverdue) return bOverdue - aOverdue

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return res.status(200).json(parsed)
}

export default withAuth(handler, 'CASEWORKER')
