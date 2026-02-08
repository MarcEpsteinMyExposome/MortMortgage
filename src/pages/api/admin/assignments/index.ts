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

  const { applicationId, assignedToId, note } = req.body

  if (!applicationId || !assignedToId) {
    return res.status(400).json({ error: 'applicationId and assignedToId are required' })
  }

  const app = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!app) return res.status(404).json({ error: 'Application not found' })

  const caseworker = await prisma.user.findUnique({ where: { id: assignedToId } })
  if (!caseworker || !['CASEWORKER', 'ADMIN', 'SUPERVISOR'].includes(caseworker.role)) {
    return res.status(400).json({ error: 'Invalid caseworker' })
  }

  const previousAssignee = app.assignedToId
  const action = previousAssignee ? 'reassigned' : 'assigned'

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        assignedToId,
        assignedAt: new Date()
      }
    }),
    prisma.assignment.create({
      data: {
        applicationId,
        assignedToId,
        assignedBy: user.id,
        action,
        note: note || null
      }
    })
  ])

  const updated = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { assignedTo: true }
  })

  return res.status(200).json(updated)
}

export default withAuth(handler, 'ADMIN')
