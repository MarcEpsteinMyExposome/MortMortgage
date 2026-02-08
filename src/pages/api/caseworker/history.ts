import { PrismaClient } from '@prisma/client'
import { withAuth } from '../../../lib/auth'

const prisma = new PrismaClient()

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const page = parseInt(req.query.page || '1', 10)
  const limit = parseInt(req.query.limit || '10', 10)
  const skip = (page - 1) * limit

  const [apps, total] = await Promise.all([
    prisma.application.findMany({
      where: {
        assignedToId: user.id,
        status: { in: ['approved', 'denied'] }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.application.count({
      where: {
        assignedToId: user.id,
        status: { in: ['approved', 'denied'] }
      }
    })
  ])

  const parsed = apps.map((app: any) => ({
    ...app,
    data: JSON.parse(app.data || '{}'),
    borrowers: JSON.parse(app.borrowers || '[]')
  }))

  return res.status(200).json({ items: parsed, total, page, limit })
}

export default withAuth(handler, 'CASEWORKER')
