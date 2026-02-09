import { prisma } from '../../../../lib/prisma'

export default async function handler(req: any, res: any) {
  const { docId } = req.query

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' })
  }

  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // Fetch document with OCR fields from database
    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: {
        id: true,
        filename: true,
        documentType: true,
        ocrStatus: true,
        ocrProvider: true,
        extractedData: true,
        extractedFields: true,
        extractionConfidence: true,
        fieldConfidences: true,
        processingError: true,
        processedAt: true,
        retryCount: true
      }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Parse JSON fields from SQLite strings
    const response: any = {
      id: document.id,
      filename: document.filename,
      documentType: document.documentType,
      ocrStatus: document.ocrStatus,
      ocrProvider: document.ocrProvider,
      extractionConfidence: document.extractionConfidence,
      processedAt: document.processedAt,
      retryCount: document.retryCount
    }

    // Parse extractedData if present
    if (document.extractedData) {
      try {
        response.extractedData = JSON.parse(document.extractedData)
      } catch {
        response.extractedData = null
      }
    } else {
      response.extractedData = null
    }

    // Parse extractedFields if present
    if (document.extractedFields) {
      try {
        response.extractedFields = JSON.parse(document.extractedFields)
      } catch {
        response.extractedFields = null
      }
    } else {
      response.extractedFields = null
    }

    // Parse fieldConfidences if present
    if (document.fieldConfidences) {
      try {
        response.fieldConfidences = JSON.parse(document.fieldConfidences)
      } catch {
        response.fieldConfidences = null
      }
    } else {
      response.fieldConfidences = null
    }

    // Include error if failed
    if (document.ocrStatus === 'failed' && document.processingError) {
      response.error = document.processingError
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('Error fetching extraction results:', error)
    return res.status(500).json({
      error: 'Failed to fetch extraction results',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
