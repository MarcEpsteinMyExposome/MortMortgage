import { prisma } from '../../../../lib/prisma'
import { withAuth, isRole } from '../../../../lib/auth'

async function handler(req: any, res: any, user: any) {
  if (!isRole(user, 'ADMIN', 'SUPERVISOR')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).end()
  }

  const { id } = req.query
  const { name, active } = req.body

  const cw = await prisma.user.findUnique({ where: { id } })
  if (!cw || cw.role !== 'CASEWORKER') {
    return res.status(404).json({ error: 'Caseworker not found' })
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (active !== undefined) updateData.active = active

  const updated = await prisma.user.update({
    where: { id },
    data: updateData
  })

  return res.status(200).json(updated)
}

export default withAuth(handler, 'ADMIN')
