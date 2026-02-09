import { prisma } from '../../../../lib/prisma'
import { generateURLAPdf } from '../../../../lib/pdf-generator'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid application ID' })
  }

  try {
    const app = await prisma.application.findUnique({
      where: { id }
    })

    if (!app) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Parse stored JSON
    const parsedApp = {
      id: app.id,
      status: app.status,
      data: JSON.parse(app.data || '{}'),
      borrowers: JSON.parse(app.borrowers || '[]'),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    }

    // Generate PDF
    const pdfBuffer = await generateURLAPdf(parsedApp)

    // Return PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="URLA-${id}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    return res.status(200).send(pdfBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    return res.status(500).json({ error: 'Failed to generate PDF' })
  }
}
