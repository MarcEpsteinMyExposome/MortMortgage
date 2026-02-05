import React, { useState } from 'react'

export interface AutoFillField {
  field: string
  label: string
  value: string | number
  confidence: number
}

interface AutoFillSuggestionProps {
  documentType: string
  fields: AutoFillField[]
  onAccept: (fields: AutoFillField[]) => void
  onDismiss: () => void
}

export default function AutoFillSuggestion({
  documentType,
  fields,
  onAccept,
  onDismiss
}: AutoFillSuggestionProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(fields.map(f => f.field))
  )

  function toggleField(field: string) {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(field)) {
      newSelected.delete(field)
    } else {
      newSelected.add(field)
    }
    setSelectedFields(newSelected)
  }

  function handleAccept() {
    const acceptedFields = fields.filter(f => selectedFields.has(f.field))
    onAccept(acceptedFields)
  }

  function formatValue(value: string | number): string {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    }
    return String(value)
  }

  function getConfidenceLabel(confidence: number): { label: string; color: string } {
    if (confidence >= 80) return { label: 'High', color: 'text-green-600' }
    if (confidence >= 60) return { label: 'Medium', color: 'text-yellow-600' }
    return { label: 'Low', color: 'text-red-600' }
  }

  const documentTypeLabel = documentType === 'w2' ? 'W-2' :
    documentType === 'paystub' ? 'Pay Stub' :
    documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  if (fields.length === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">
            Auto-fill from {documentTypeLabel}?
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            We extracted the following information. Select fields to auto-fill:
          </p>

          {/* Field checkboxes */}
          <div className="space-y-2 mb-4">
            {fields.map((field) => {
              const conf = getConfidenceLabel(field.confidence)
              return (
                <label
                  key={field.field}
                  className="flex items-center gap-3 p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.field)}
                    onChange={() => toggleField(field.field)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{field.label}</span>
                      <span className={`text-xs ${conf.color}`}>({conf.label})</span>
                    </div>
                    <span className="text-sm text-gray-600 truncate block">
                      {formatValue(field.value)}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              disabled={selectedFields.size === 0}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Auto-fill Selected ({selectedFields.size})
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
            >
              No thanks, I'll enter manually
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
