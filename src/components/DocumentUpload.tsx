import React, { useState, useRef } from 'react'

const DOCUMENT_TYPES = [
  { value: 'w2', label: 'W-2 Form' },
  { value: 'paystub', label: 'Pay Stub' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'id', label: 'Government ID' },
  { value: 'proof_of_residence', label: 'Proof of Residence' },
  { value: 'employment_letter', label: 'Employment Verification Letter' },
  { value: 'other', label: 'Other' }
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

type Document = {
  id: string
  filename: string
  contentType: string
  documentType: string
  createdAt: string
}

type Props = {
  applicationId: string
  documents: Document[]
  onUpload: () => void
}

export default function DocumentUpload({ applicationId, documents, onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState('w2')

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
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

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      onUpload()

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/apps/${applicationId}/documents/${docId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        onUpload()
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  function getDocumentTypeLabel(type: string): string {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type
  }

  function getFileIcon(contentType: string): string {
    if (contentType === 'application/pdf') return '📄'
    if (contentType.startsWith('image/')) return '🖼️'
    return '📎'
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Documents</h3>

      {/* Upload Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex flex-col flex-1">
            <span className="text-sm font-medium mb-1">Document Type</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input"
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <div className="flex-1">
            <span className="text-sm font-medium block mb-1">File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
              className="w-full text-sm"
            />
          </div>

          {uploading && (
            <span className="text-blue-600 text-sm">Uploading...</span>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Accepted formats: PDF, JPG, PNG. Max size: 10MB.
        </p>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y">
          {documents.map(doc => (
            <li key={doc.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(doc.contentType)}</span>
                <div>
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-sm text-gray-500">
                    {getDocumentTypeLabel(doc.documentType)} •
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
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
    </div>
  )
}
