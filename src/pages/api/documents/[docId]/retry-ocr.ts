import { prisma } from '../../../../lib/prisma'
import { isVercel } from '../../../../lib/env'
import fs from 'fs'
import { extractDocument, SupportedDocumentType, ExtractedField } from '../../../../lib/ocr'

// Maximum number of retries allowed
const MAX_RETRIES = 3

export default async function handler(req: any, res: any) {
  const { docId } = req.query

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  if (isVercel) {
    return res.status(501).json({ error: 'OCR processing requires local file access and is not available in the hosted demo.' })
  }

  try {
    // Fetch document from database
    const document = await prisma.document.findUnique({
      where: { id: docId }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Check retry count
    if (document.retryCount >= MAX_RETRIES) {
      return res.status(400).json({
        error: 'Maximum retry attempts exceeded',
        retryCount: document.retryCount,
        maxRetries: MAX_RETRIES
      })
    }

    // Check if file exists on disk
    if (!fs.existsSync(document.path)) {
      return res.status(404).json({ error: 'Document file not found on disk' })
    }

    // Reset status to pending and increment retry count
    await prisma.document.update({
      where: { id: docId },
      data: {
        ocrStatus: 'pending',
        retryCount: document.retryCount + 1,
        processingError: null
      }
    })

    // Update status to processing
    await prisma.document.update({
      where: { id: docId },
      data: { ocrStatus: 'processing' }
    })

    // Read file from disk
    const fileBuffer = fs.readFileSync(document.path)

    // Get document type from request body or use existing
    const { documentType } = req.body || {}
    const docType: SupportedDocumentType = documentType || document.documentType as SupportedDocumentType || 'other'

    // Call OCR orchestrator
    const result = await extractDocument(
      fileBuffer,
      document.contentType,
      docType
    )

    // Prepare update data
    const updateData: any = {
      ocrStatus: result.success ? 'completed' : 'failed',
      ocrProvider: result.provider,
      extractionConfidence: result.overallConfidence,
      processedAt: new Date()
    }

    if (result.success && result.extraction) {
      // Store extraction data as JSON strings (SQLite limitation)
      updateData.extractedData = JSON.stringify(result.extraction)

      // Extract normalized fields for easier querying
      const fields: Record<string, any> = {}
      const confidences: Record<string, number> = {}

      for (const [key, value] of Object.entries(result.extraction)) {
        if (key === 'documentType' || key === 'rawText') continue
        if (typeof value === 'object' && value !== null && 'value' in value && 'confidence' in value) {
          const field = value as ExtractedField
          fields[key] = field.value
          confidences[key] = field.confidence
        }
      }

      updateData.extractedFields = JSON.stringify(fields)
      updateData.fieldConfidences = JSON.stringify(confidences)
      updateData.processingError = null
    } else {
      updateData.processingError = result.error || 'Unknown extraction error'
    }

    // Update document record with extraction results
    const updatedDocument = await prisma.document.update({
      where: { id: docId },
      data: updateData
    })

    // Return the extraction result
    return res.status(200).json({
      success: result.success,
      documentId: docId,
      retryCount: document.retryCount + 1,
      provider: result.provider,
      documentType: result.documentType,
      extraction: result.extraction,
      overallConfidence: result.overallConfidence,
      processingTimeMs: result.processingTimeMs,
      error: result.error
    })

  } catch (error) {
    console.error('Error retrying document OCR:', error)

    // Update document status to failed
    try {
      await prisma.document.update({
        where: { id: docId },
        data: {
          ocrStatus: 'failed',
          processingError: error instanceof Error ? error.message : 'Unknown error',
          processedAt: new Date()
        }
      })
    } catch (updateError) {
      console.error('Error updating document status:', updateError)
    }

    return res.status(500).json({
      error: 'Failed to retry document OCR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
