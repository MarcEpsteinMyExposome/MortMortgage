import { PrismaClient } from '@prisma/client'
import { withAuth, isRole } from '../../../../lib/auth'

const prisma = new PrismaClient()

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  if (!isRole(user, 'ADMIN', 'SUPERVISOR')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Get unassigned submitted apps
  const unassigned = await prisma.application.findMany({
    where: {
      assignedToId: null,
      status: 'submitted'
    },
    orderBy: { createdAt: 'asc' }
  })

  if (unassigned.length === 0) {
    return res.status(200).json({ assigned: 0, message: 'No unassigned applications' })
  }

  // Get active caseworkers with their current queue sizes
  const caseworkers = await prisma.user.findMany({
    where: { role: 'CASEWORKER', active: true }
  })

  if (caseworkers.length === 0) {
    return res.status(400).json({ error: 'No active caseworkers available' })
  }

  // Count current active assignments per caseworker
  const counts: Record<string, number> = {}
  for (const cw of caseworkers) {
    counts[cw.id] = await prisma.application.count({
      where: {
        assignedToId: cw.id,
        status: { notIn: ['approved', 'denied'] }
      }
    })
  }

  // Round-robin assignment (assign to caseworker with fewest active)
  let assigned = 0
  for (const app of unassigned) {
    // Find caseworker with lowest count
    const sortedCws = caseworkers.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0))
    const target = sortedCws[0]

    await prisma.$transaction([
      prisma.application.update({
        where: { id: app.id },
        data: {
          assignedToId: target.id,
          assignedAt: new Date()
        }
      }),
      prisma.assignment.create({
        data: {
          applicationId: app.id,
          assignedToId: target.id,
          assignedBy: user.id,
          action: 'assigned',
          note: 'Auto-assigned via round-robin'
        }
      })
    ])

    counts[target.id] = (counts[target.id] || 0) + 1
    assigned++
  }

  return res.status(200).json({ assigned, message: `Assigned ${assigned} applications` })
}

export default withAuth(handler, 'ADMIN')
