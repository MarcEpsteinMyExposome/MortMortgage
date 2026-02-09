import { prisma } from '../../../../lib/prisma'
import { withAuth, isRole } from '../../../../lib/auth'

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end()
  }

  if (!isRole(user, 'ADMIN', 'SUPERVISOR')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { applicationId } = req.query

  const app = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!app) return res.status(404).json({ error: 'Application not found' })
  if (!app.assignedToId) return res.status(400).json({ error: 'Application is not assigned' })

  const previousAssignee = app.assignedToId

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        assignedToId: null,
        assignedAt: null
      }
    }),
    prisma.assignment.create({
      data: {
        applicationId,
        assignedToId: previousAssignee,
        assignedBy: user.id,
        action: 'unassigned'
      }
    })
  ])

  return res.status(200).json({ success: true })
}

export default withAuth(handler, 'ADMIN')
