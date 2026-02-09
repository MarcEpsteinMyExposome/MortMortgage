import { prisma } from '../../../../lib/prisma'
import { isVercel } from '../../../../lib/env'
import fs from 'fs'
import { extractDocument, SupportedDocumentType, ExtractedField } from '../../../../lib/ocr'

interface ProcessingResult {
  documentId: string
  filename: string
  success: boolean
  provider?: string
  documentType?: string
  overallConfidence?: number
  processingTimeMs?: number
  error?: string
}

export default async function handler(req: any, res: any) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid application ID' })
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
    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id }
    })

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Find all documents for this application with ocrStatus "pending"
    const pendingDocuments = await prisma.document.findMany({
      where: {
        applicationId: id,
        ocrStatus: 'pending'
      }
    })

    if (pendingDocuments.length === 0) {
      return res.status(200).json({
        message: 'No pending documents to process',
        processed: 0,
        results: []
      })
    }

    const results: ProcessingResult[] = []

    // Process each document
    for (const document of pendingDocuments) {
      const result: ProcessingResult = {
        documentId: document.id,
        filename: document.filename,
        success: false
      }

      try {
        // Check if file exists on disk
        if (!fs.existsSync(document.path)) {
          result.error = 'File not found on disk'
          results.push(result)

          // Update document status
          await prisma.document.update({
            where: { id: document.id },
            data: {
              ocrStatus: 'failed',
              processingError: 'File not found on disk',
              processedAt: new Date()
            }
          })
          continue
        }

        // Update status to processing
        await prisma.document.update({
          where: { id: document.id },
          data: { ocrStatus: 'processing' }
        })

        // Read file from disk
        const fileBuffer = fs.readFileSync(document.path)

        // Get document type
        const docType: SupportedDocumentType = document.documentType as SupportedDocumentType || 'other'

        // Call OCR orchestrator
        const extractionResult = await extractDocument(
          fileBuffer,
          document.contentType,
          docType
        )

        // Update result
        result.success = extractionResult.success
        result.provider = extractionResult.provider
        result.documentType = extractionResult.documentType
        result.overallConfidence = extractionResult.overallConfidence
        result.processingTimeMs = extractionResult.processingTimeMs

        if (!extractionResult.success) {
          result.error = extractionResult.error
        }

        // Prepare update data
        const updateData: any = {
          ocrStatus: extractionResult.success ? 'completed' : 'failed',
          ocrProvider: extractionResult.provider,
          extractionConfidence: extractionResult.overallConfidence,
          processedAt: new Date()
        }

        if (extractionResult.success && extractionResult.extraction) {
          // Store extraction data as JSON strings (SQLite limitation)
          updateData.extractedData = JSON.stringify(extractionResult.extraction)

          // Extract normalized fields for easier querying
          const fields: Record<string, any> = {}
          const confidences: Record<string, number> = {}

          for (const [key, value] of Object.entries(extractionResult.extraction)) {
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
          updateData.processingError = extractionResult.error || 'Unknown extraction error'
        }

        // Update document record
        await prisma.document.update({
          where: { id: document.id },
          data: updateData
        })

      } catch (docError) {
        result.error = docError instanceof Error ? docError.message : 'Unknown error'

        // Update document status to failed
        try {
          await prisma.document.update({
            where: { id: document.id },
            data: {
              ocrStatus: 'failed',
              processingError: result.error,
              processedAt: new Date()
            }
          })
        } catch (updateError) {
          console.error('Error updating document status:', updateError)
        }
      }

      results.push(result)
    }

    // Calculate summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return res.status(200).json({
      applicationId: id,
      processed: results.length,
      successful,
      failed,
      results
    })

  } catch (error) {
    console.error('Error batch processing documents:', error)
    return res.status(500).json({
      error: 'Failed to process documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
