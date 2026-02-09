import { prisma } from '../../../lib/prisma'

export default async function handler(req: any, res: any) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid application ID' })
    return
  }

  // GET - Fetch single application
  if (req.method === 'GET') {
    try {
      const app = await prisma.application.findUnique({
        where: { id },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      })

      if (!app) {
        res.status(404).json({ error: 'Application not found' })
        return
      }

      res.status(200).json({
        ...app,
        data: JSON.parse(app.data || '{}'),
        borrowers: JSON.parse(app.borrowers || '[]')
      })
    } catch (error) {
      console.error('Error fetching application:', error)
      res.status(500).json({ error: 'Failed to fetch application' })
    }
    return
  }

  // PUT - Update application
  if (req.method === 'PUT') {
    try {
      const { status, data, borrowers, priority, slaDeadline } = req.body

      const updateData: any = {
        updatedAt: new Date()
      }

      if (status !== undefined) {
        updateData.status = status
      }

      if (data !== undefined) {
        updateData.data = JSON.stringify(data)
      }

      if (borrowers !== undefined) {
        updateData.borrowers = JSON.stringify(borrowers)
      }

      if (priority !== undefined) {
        updateData.priority = priority
      }

      if (slaDeadline !== undefined) {
        updateData.slaDeadline = slaDeadline ? new Date(slaDeadline) : null
      }

      const app = await prisma.application.update({
        where: { id },
        data: updateData
      })

      res.status(200).json({
        ...app,
        data: JSON.parse(app.data || '{}'),
        borrowers: JSON.parse(app.borrowers || '[]')
      })
    } catch (error) {
      console.error('Error updating application:', error)
      res.status(500).json({ error: 'Failed to update application' })
    }
    return
  }

  // DELETE - Delete application
  if (req.method === 'DELETE') {
    try {
      await prisma.application.delete({
        where: { id }
      })

      res.status(204).end()
    } catch (error) {
      console.error('Error deleting application:', error)
      res.status(500).json({ error: 'Failed to delete application' })
    }
    return
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
