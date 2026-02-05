import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { StepProps } from '../ApplicationWizard'
import { ExtractionStatus, ExtractionResults, AutoFillSuggestion } from '../ai'
import type { ExtractionStatusType, AutoFillField } from '../ai'
import type { DocumentExtraction } from '../../lib/ocr/types'

const DOCUMENT_TYPES = [
  { value: 'w2', label: 'W-2 Form', required: true },
  { value: 'paystub', label: 'Pay Stub (recent)', required: true },
  { value: 'bank_statement', label: 'Bank Statement', required: true },
  { value: 'tax_return', label: 'Tax Return', required: false },
  { value: 'id', label: 'Government ID', required: true },
  { value: 'proof_of_residence', label: 'Proof of Residence', required: false },
  { value: 'employment_letter', label: 'Employment Verification', required: false },
  { value: 'other', label: 'Other', required: false }
]

// Document types that support OCR extraction
const OCR_SUPPORTED_TYPES = ['w2', 'paystub', 'bank_statement', 'id']

type Document = {
  id: string
  filename: string
  contentType: string
  documentType: string
  createdAt: string
  // OCR-related fields
  ocrStatus?: ExtractionStatusType
  ocrProvider?: string
  extractionConfidence?: number
  extractedData?: DocumentExtraction
  extractedFields?: Record<string, any>
  fieldConfidences?: Record<string, number>
  processingError?: string
  retryCount?: number
}

type DocumentOCRState = {
  status: ExtractionStatusType
  provider?: string
  confidence?: number
  extraction?: DocumentExtraction
  extractedFields?: Record<string, any>
  fieldConfidences?: Record<string, number>
  error?: string
  retryCount?: number
}

export default function DocumentsStep({ data, onUpdate, onNext, onBack }: StepProps & { applicationId?: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState('w2')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // OCR state per document
  const [ocrStates, setOcrStates] = useState<Record<string, DocumentOCRState>>({})

  // Expanded state for showing extraction results
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())

  // Auto-fill suggestions state
  const [autoFillSuggestion, setAutoFillSuggestion] = useState<{
    docId: string
    documentType: string
    fields: AutoFillField[]
  } | null>(null)

  // Get application ID from the URL
  const applicationId = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[2]
    : ''

  // Load documents and their OCR status
  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${applicationId}/documents`)
      if (res.ok) {
        const docs: Document[] = await res.json()
        setDocuments(docs)

        // Initialize OCR states from document data
        const initialOcrStates: Record<string, DocumentOCRState> = {}
        for (const doc of docs) {
          if (doc.ocrStatus) {
            initialOcrStates[doc.id] = {
              status: doc.ocrStatus as ExtractionStatusType,
              provider: doc.ocrProvider,
              confidence: doc.extractionConfidence,
              extraction: doc.extractedData,
              extractedFields: doc.extractedFields,
              fieldConfidences: doc.fieldConfidences,
              error: doc.processingError,
              retryCount: doc.retryCount
            }
          }
        }
        setOcrStates(prevStates => ({
          ...prevStates,
          ...initialOcrStates
        }))
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    if (!applicationId) return
    loadDocuments()
  }, [applicationId, loadDocuments])

  // Fetch extraction status for a single document
  async function fetchExtractionStatus(docId: string): Promise<DocumentOCRState | null> {
    try {
      const res = await fetch(`/api/documents/${docId}/extraction`)
      if (res.ok) {
        const data = await res.json()
        return {
          status: data.ocrStatus as ExtractionStatusType || 'pending',
          provider: data.ocrProvider,
          confidence: data.extractionConfidence,
          extraction: data.extractedData,
          extractedFields: data.extractedFields,
          fieldConfidences: data.fieldConfidences,
          error: data.error,
          retryCount: data.retryCount
        }
      }
    } catch (err) {
      console.error('Failed to fetch extraction status:', err)
    }
    return null
  }

  // Process a document with OCR
  async function processDocument(docId: string, docType: string) {
    // Update state to processing
    setOcrStates(prev => ({
      ...prev,
      [docId]: { status: 'processing' }
    }))

    try {
      const res = await fetch(`/api/documents/${docId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docType })
      })

      const result = await res.json()

      if (result.success) {
        const newState: DocumentOCRState = {
          status: 'completed',
          provider: result.provider,
          confidence: result.overallConfidence,
          extraction: result.extraction,
          extractedFields: result.extraction,
          fieldConfidences: undefined, // Will be derived from extraction
          retryCount: 0
        }

        setOcrStates(prev => ({
          ...prev,
          [docId]: newState
        }))

        // Check if we should offer auto-fill
        if (docType === 'w2' || docType === 'paystub') {
          const autoFillFields = extractAutoFillFields(docType, result.extraction)
          if (autoFillFields.length > 0) {
            setAutoFillSuggestion({
              docId,
              documentType: docType,
              fields: autoFillFields
            })
          }
        }
      } else {
        setOcrStates(prev => ({
          ...prev,
          [docId]: {
            status: 'failed',
            error: result.error || 'Processing failed',
            retryCount: result.retryCount || 0
          }
        }))
      }
    } catch (err: any) {
      setOcrStates(prev => ({
        ...prev,
        [docId]: {
          status: 'failed',
          error: err?.message || 'Network error',
          retryCount: prev[docId]?.retryCount || 0
        }
      }))
    }
  }

  // Retry OCR for a failed document
  async function retryOCR(docId: string, docType: string) {
    setOcrStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], status: 'processing' }
    }))

    try {
      const res = await fetch(`/api/documents/${docId}/retry-ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docType })
      })

      const result = await res.json()

      if (result.success) {
        setOcrStates(prev => ({
          ...prev,
          [docId]: {
            status: 'completed',
            provider: result.provider,
            confidence: result.overallConfidence,
            extraction: result.extraction,
            extractedFields: result.extraction,
            retryCount: result.retryCount
          }
        }))

        // Check if we should offer auto-fill
        if (docType === 'w2' || docType === 'paystub') {
          const autoFillFields = extractAutoFillFields(docType, result.extraction)
          if (autoFillFields.length > 0) {
            setAutoFillSuggestion({
              docId,
              documentType: docType,
              fields: autoFillFields
            })
          }
        }
      } else {
        setOcrStates(prev => ({
          ...prev,
          [docId]: {
            status: 'failed',
            error: result.error || 'Retry failed',
            retryCount: result.retryCount || (prev[docId]?.retryCount || 0) + 1
          }
        }))
      }
    } catch (err: any) {
      setOcrStates(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          status: 'failed',
          error: err?.message || 'Network error'
        }
      }))
    }
  }

  // Extract fields that can be used for auto-fill
  function extractAutoFillFields(docType: string, extraction: DocumentExtraction | null): AutoFillField[] {
    if (!extraction) return []

    const fields: AutoFillField[] = []

    if (docType === 'w2' && extraction.documentType === 'w2') {
      // Extract employer name
      if (extraction.employerName?.value) {
        fields.push({
          field: 'employerName',
          label: 'Employer Name',
          value: extraction.employerName.value as string,
          confidence: extraction.employerName.confidence
        })
      }
      // Extract annual income from Box 1 (wages)
      if (extraction.wagesTipsCompensation?.value) {
        fields.push({
          field: 'annualIncome',
          label: 'Annual Income',
          value: Number(extraction.wagesTipsCompensation.value),
          confidence: extraction.wagesTipsCompensation.confidence
        })
        // Also calculate monthly income
        fields.push({
          field: 'monthlyIncome',
          label: 'Monthly Income',
          value: Math.round(Number(extraction.wagesTipsCompensation.value) / 12),
          confidence: extraction.wagesTipsCompensation.confidence
        })
      }
    }

    if (docType === 'paystub' && extraction.documentType === 'paystub') {
      if (extraction.employerName?.value) {
        fields.push({
          field: 'employerName',
          label: 'Employer Name',
          value: extraction.employerName.value as string,
          confidence: extraction.employerName.confidence
        })
      }
      // Use YTD gross to estimate annual income
      if (extraction.ytdGrossPay?.value) {
        // Estimate annual based on YTD
        const ytdGross = Number(extraction.ytdGrossPay.value)
        // Rough estimate - assume we're mid-year
        const estimatedAnnual = ytdGross * 2
        fields.push({
          field: 'annualIncome',
          label: 'Estimated Annual Income',
          value: estimatedAnnual,
          confidence: Math.min(extraction.ytdGrossPay.confidence, 70) // Lower confidence for estimate
        })
        fields.push({
          field: 'monthlyIncome',
          label: 'Estimated Monthly Income',
          value: Math.round(estimatedAnnual / 12),
          confidence: Math.min(extraction.ytdGrossPay.confidence, 70)
        })
      } else if (extraction.grossPay?.value) {
        // Use gross pay for period
        fields.push({
          field: 'periodGrossPay',
          label: 'Gross Pay (this period)',
          value: Number(extraction.grossPay.value),
          confidence: extraction.grossPay.confidence
        })
      }
    }

    return fields
  }

  // Handle auto-fill acceptance
  function handleAutoFillAccept(fields: AutoFillField[]) {
    // Update the application data with extracted values
    const updatedBorrowers = [...(data.borrowers || [])]
    const borrowerIndex = 0 // Primary borrower

    // Ensure borrower exists
    while (updatedBorrowers.length <= borrowerIndex) {
      updatedBorrowers.push({ borrowerType: updatedBorrowers.length === 0 ? 'borrower' : 'co_borrower' })
    }

    const borrower = updatedBorrowers[borrowerIndex]
    const employment = borrower.employment || [{
      current: true,
      employerName: '',
      position: '',
      startDate: '',
      selfEmployed: false,
      monthlyIncome: 0
    }]

    // Find current employment
    const currentEmploymentIndex = employment.findIndex((e: any) => e.current)
    const employmentIndex = currentEmploymentIndex >= 0 ? currentEmploymentIndex : 0

    // Apply each field
    for (const field of fields) {
      if (field.field === 'employerName') {
        employment[employmentIndex].employerName = field.value as string
      } else if (field.field === 'monthlyIncome') {
        employment[employmentIndex].monthlyIncome = field.value as number
      }
      // Note: annualIncome is used to derive monthlyIncome, but we store monthly
    }

    updatedBorrowers[borrowerIndex] = {
      ...borrower,
      employment
    }

    // Update the wizard data
    onUpdate('borrowers', updatedBorrowers)

    // Clear the auto-fill suggestion
    setAutoFillSuggestion(null)
  }

  // Handle file upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const res = await fetch(`/api/apps/${applicationId}/documents`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Upload failed')

      const uploadedDoc = await res.json()

      // Reload documents to get the new one
      await loadDocuments()

      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Auto-trigger OCR for supported document types
      if (OCR_SUPPORTED_TYPES.includes(documentType)) {
        // Get the newly uploaded document ID
        const newDocId = uploadedDoc.id
        if (newDocId) {
          processDocument(newDocId, documentType)
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return

    try {
      await fetch(`/api/apps/${applicationId}/documents/${docId}`, { method: 'DELETE' })

      // Clear OCR state for this document
      setOcrStates(prev => {
        const newState = { ...prev }
        delete newState[docId]
        return newState
      })

      // Clear auto-fill if it was for this document
      if (autoFillSuggestion?.docId === docId) {
        setAutoFillSuggestion(null)
      }

      loadDocuments()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  function toggleExpanded(docId: string) {
    setExpandedDocs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  function getDocumentTypeLabel(type: string): string {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type
  }

  function getMissingRequired(): string[] {
    const uploadedTypes = documents.map(d => d.documentType)
    return DOCUMENT_TYPES
      .filter(t => t.required && !uploadedTypes.includes(t.value))
      .map(t => t.label)
  }

  const missingRequired = getMissingRequired()

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Supporting Documents</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload supporting documents for your application. Required documents are marked with *.
        Documents will be automatically analyzed to extract information.
      </p>

      {/* Auto-fill Suggestion */}
      {autoFillSuggestion && (
        <div className="mb-6">
          <AutoFillSuggestion
            documentType={autoFillSuggestion.documentType}
            fields={autoFillSuggestion.fields}
            onAccept={handleAutoFillAccept}
            onDismiss={() => setAutoFillSuggestion(null)}
          />
        </div>
      )}

      {/* Required Documents Checklist */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium mb-2">Required Documents</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {DOCUMENT_TYPES.filter(t => t.required).map(t => {
            const uploaded = documents.some(d => d.documentType === t.value)
            return (
              <div key={t.value} className="flex items-center gap-2">
                <span className={uploaded ? 'text-green-600' : 'text-gray-400'}>
                  {uploaded ? '✓' : '○'}
                </span>
                <span className={uploaded ? 'text-green-700' : ''}>{t.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upload Form */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex flex-col flex-1">
            <span className="text-sm font-medium mb-1">Document Type</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input"
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label} {t.required ? '*' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="flex-1">
            <span className="text-sm font-medium block mb-1">Select File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="w-full text-sm"
            />
          </div>
        </div>

        {uploading && <p className="text-blue-600 text-sm mt-2">Uploading...</p>}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <p className="text-xs text-gray-500 mt-2">
          PDF, JPG, PNG up to 10MB.
          {OCR_SUPPORTED_TYPES.includes(documentType) && (
            <span className="text-blue-600 ml-1">
              This document type supports automatic data extraction.
            </span>
          )}
        </p>
      </div>

      {/* Uploaded Documents */}
      <h4 className="font-medium mb-2">Uploaded Documents ({documents.length})</h4>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {documents.map(doc => {
            const ocrState = ocrStates[doc.id]
            const isExpanded = expandedDocs.has(doc.id)
            const supportsOCR = OCR_SUPPORTED_TYPES.includes(doc.documentType)
            const canProcess = supportsOCR && (!ocrState || ocrState.status === 'pending')

            return (
              <li key={doc.id} className="p-3">
                {/* Document header row */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{doc.filename}</p>
                    <p className="text-sm text-gray-500">
                      {getDocumentTypeLabel(doc.documentType)} •{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* Process Document button for unprocessed OCR-supported docs */}
                    {canProcess && (
                      <button
                        onClick={() => processDocument(doc.id, doc.documentType)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Process
                      </button>
                    )}
                    <a
                      href={`/api/apps/${applicationId}/documents/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* OCR Status and Results */}
                {supportsOCR && ocrState && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {/* Extraction Status */}
                    <ExtractionStatus
                      status={ocrState.status}
                      provider={ocrState.provider}
                      confidence={ocrState.confidence}
                      error={ocrState.error}
                      onRetry={ocrState.status === 'failed' ? () => retryOCR(doc.id, doc.documentType) : undefined}
                      retryCount={ocrState.retryCount}
                      maxRetries={3}
                    />

                    {/* Extraction Results (expandable) */}
                    {ocrState.status === 'completed' && ocrState.extraction && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleExpanded(doc.id)}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? 'Hide' : 'Show'} extracted data
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="mt-2">
                            <ExtractionResults
                              extraction={ocrState.extraction}
                              fieldConfidences={ocrState.fieldConfidences}
                              defaultExpanded={true}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Warning for missing docs */}
      {missingRequired.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-4 text-sm">
          <strong>Missing required documents:</strong> {missingRequired.join(', ')}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button type="button" onClick={onBack} className="btn bg-gray-200 text-gray-700">
          Back
        </button>
        <button type="button" onClick={onNext} className="btn">
          Continue
        </button>
      </div>
    </div>
  )
}
