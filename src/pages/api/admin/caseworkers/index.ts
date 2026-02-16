import { prisma } from '../../../../lib/prisma'
import { withAuth, isRole } from '../../../../lib/auth'

async function handler(req: any, res: any, user: any) {
  if (req.method === 'GET') {
    if (!isRole(user, 'CASEWORKER', 'SUPERVISOR')) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const caseworkers = await prisma.user.findMany({
      where: { role: 'CASEWORKER' },
      orderBy: { name: 'asc' }
    })

    // Enrich with stats
    const enriched = await Promise.all(caseworkers.map(async (cw) => {
      const activeCount = await prisma.application.count({
        where: {
          assignedToId: cw.id,
          status: { notIn: ['approved', 'denied'] }
        }
      })
      const completedCount = await prisma.application.count({
        where: {
          assignedToId: cw.id,
          status: { in: ['approved', 'denied'] }
        }
      })
      const approvedCount = await prisma.application.count({
        where: { assignedToId: cw.id, status: 'approved' }
      })

      const approvalRate = completedCount > 0
        ? Math.round((approvedCount / completedCount) * 1000) / 10
        : 0

      return {
        ...cw,
        activeQueue: activeCount,
        completedTotal: completedCount,
        approvalRate
      }
    }))

    return res.status(200).json(enriched)
  }

  if (req.method === 'POST') {
    if (!isRole(user, 'SUPERVISOR')) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const { email, name } = req.body
    if (!email || !name) {
      return res.status(400).json({ error: 'email and name are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    const newCw = await prisma.user.create({
      data: { email, name, role: 'CASEWORKER' }
    })

    return res.status(201).json(newCw)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end()
}

export default withAuth(handler, 'CASEWORKER')
