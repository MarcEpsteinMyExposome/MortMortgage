import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const apps = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } })
    // Parse JSON strings back to objects for the response
    const parsed = apps.map((app: any) => ({
      ...app,
      data: JSON.parse(app.data || '{}'),
      borrowers: JSON.parse(app.borrowers || '[]')
    }))
    return res.status(200).json(parsed)
  }

  if (req.method === 'POST') {
    const { status, data, borrowers } = req.body
    // Stringify JSON objects for SQLite storage
    const app = await prisma.application.create({
      data: {
        status: status || 'draft',
        data: JSON.stringify(data || {}),
        borrowers: JSON.stringify(borrowers || [])
      }
    })
    return res.status(201).json({
      ...app,
      data: JSON.parse(app.data),
      borrowers: JSON.parse(app.borrowers)
    })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
