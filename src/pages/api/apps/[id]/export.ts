import { prisma } from '../../../../lib/prisma'
import { mapToMISMO, mismoToXML, validateMISMO } from '../../../../lib/mismo-mapper'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id, format = 'json' } = req.query

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
      borrowers: JSON.parse(app.borrowers || '[]')
    }

    // Map to MISMO
    const mismo = mapToMISMO(parsedApp)

    // Validate
    const validation = validateMISMO(mismo)
    if (!validation.valid) {
      return res.status(400).json({
        error: 'MISMO validation failed',
        validationErrors: validation.errors
      })
    }

    // Return in requested format
    if (format === 'xml') {
      const xml = mismoToXML(mismo)
      res.setHeader('Content-Type', 'application/xml')
      res.setHeader('Content-Disposition', `attachment; filename="loan-${id}.xml"`)
      return res.status(200).send(xml)
    }

    // Default to JSON
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="loan-${id}.json"`)
    return res.status(200).json(mismo)
  } catch (error) {
    console.error('Export error:', error)
    return res.status(500).json({ error: 'Failed to export application' })
  }
}
