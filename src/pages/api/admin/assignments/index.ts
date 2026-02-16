import { prisma } from '../../../../lib/prisma'
import { withAuth, isRole } from '../../../../lib/auth'

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { applicationId, assignedToId, note } = req.body

  if (!applicationId || !assignedToId) {
    return res.status(400).json({ error: 'applicationId and assignedToId are required' })
  }

  // Caseworkers can only self-assign unassigned apps
  if (isRole(user, 'CASEWORKER')) {
    if (assignedToId !== user.id) {
      return res.status(403).json({ error: 'Caseworkers can only claim applications for themselves' })
    }
    const app = await prisma.application.findUnique({ where: { id: applicationId } })
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (app.assignedToId) {
      return res.status(400).json({ error: 'Application is already assigned' })
    }
  } else if (!isRole(user, 'SUPERVISOR')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const app = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!app) return res.status(404).json({ error: 'Application not found' })

  const caseworker = await prisma.user.findUnique({ where: { id: assignedToId } })
  if (!caseworker || !['CASEWORKER', 'SUPERVISOR'].includes(caseworker.role)) {
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

export default withAuth(handler, 'CASEWORKER')
