import React, { useState, useEffect, useRef } from 'react'
import type { StepProps } from '../ApplicationWizard'

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

type Document = {
  id: string
  filename: string
  contentType: string
  documentType: string
  createdAt: string
}

export default function DocumentsStep({ data, onNext, onBack }: StepProps & { applicationId?: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState('w2')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get application ID from the URL
  const applicationId = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[2]
    : ''

  useEffect(() => {
    if (!applicationId) return
    loadDocuments()
  }, [applicationId])

  async function loadDocuments() {
    try {
      const res = await fetch(`/api/apps/${applicationId}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

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

      loadDocuments()
      if (fileInputRef.current) fileInputRef.current.value = ''
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
      loadDocuments()
    } catch (err) {
      console.error('Delete failed:', err)
    }
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
      </p>

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
        <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG up to 10MB</p>
      </div>

      {/* Uploaded Documents */}
      <h4 className="font-medium mb-2">Uploaded Documents ({documents.length})</h4>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {documents.map(doc => (
            <li key={doc.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{doc.filename}</p>
                <p className="text-sm text-gray-500">
                  {getDocumentTypeLabel(doc.documentType)} •
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
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
            </li>
          ))}
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
