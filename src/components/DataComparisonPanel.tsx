import React from 'react'

interface Props {
  extractedData: Record<string, any>;
  enteredData: Record<string, any>;
  fieldLabels: Record<string, string>;
  onUseExtracted: (field: string) => void;
}

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const WarningIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') {
    // Format as currency if it looks like a monetary amount
    if (value >= 100 && Number.isFinite(value)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value)
    }
    return value.toString()
  }
  return String(value)
}

function normalizeValue(value: any): string {
  if (value === null || value === undefined || value === '') return ''
  return String(value).toLowerCase().trim()
}

function valuesMatch(extracted: any, entered: any): boolean {
  const normalizedExtracted = normalizeValue(extracted)
  const normalizedEntered = normalizeValue(entered)

  // Both empty is a match
  if (normalizedExtracted === '' && normalizedEntered === '') return true

  // One empty, one not is a non-match (discrepancy)
  if (normalizedExtracted === '' || normalizedEntered === '') return false

  // Try numeric comparison for numbers
  const numExtracted = parseFloat(normalizedExtracted.replace(/[$,]/g, ''))
  const numEntered = parseFloat(normalizedEntered.replace(/[$,]/g, ''))
  if (!isNaN(numExtracted) && !isNaN(numEntered)) {
    return Math.abs(numExtracted - numEntered) < 0.01
  }

  return normalizedExtracted === normalizedEntered
}

export default function DataComparisonPanel({
  extractedData,
  enteredData,
  fieldLabels,
  onUseExtracted
}: Props) {
  // Get all unique fields from both datasets
  const allFields = Array.from(new Set([
    ...Object.keys(extractedData),
    ...Object.keys(enteredData),
  ]))

  const comparisons = allFields.map(field => {
    const extracted = extractedData[field]
    const entered = enteredData[field]
    const matches = valuesMatch(extracted, entered)
    const hasExtracted = extracted !== null && extracted !== undefined && extracted !== ''
    const hasEntered = entered !== null && entered !== undefined && entered !== ''

    return {
      field,
      label: fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      extracted,
      entered,
      matches,
      hasExtracted,
      hasEntered,
      isDiscrepancy: hasExtracted && hasEntered && !matches,
    }
  })

  const discrepancies = comparisons.filter(c => c.isDiscrepancy)
  const matches = comparisons.filter(c => c.matches && c.hasExtracted && c.hasEntered)

  if (comparisons.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-sm text-gray-500">No data available for comparison.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Data Comparison
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Compare extracted document data with your form entries
        </p>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className={`badge ${discrepancies.length > 0 ? 'bg-warning-100 text-warning-800' : 'bg-success-100 text-success-800'}`}>
              {discrepancies.length} discrepancies
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-success-100 text-success-800">
              {matches.length} matches
            </span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <div className="col-span-3">Field</div>
        <div className="col-span-4">From Document</div>
        <div className="col-span-4">You Entered</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {comparisons.map(({ field, label, extracted, entered, matches, isDiscrepancy, hasExtracted }) => (
          <div
            key={field}
            className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
              isDiscrepancy ? 'bg-warning-50' : 'hover:bg-gray-50'
            }`}
          >
            {/* Field Label */}
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                {isDiscrepancy && (
                  <WarningIcon className="w-4 h-4 text-warning-500 flex-shrink-0" />
                )}
                {matches && hasExtracted && (
                  <CheckIcon className="w-4 h-4 text-success-500 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
              </div>
            </div>

            {/* Extracted Value */}
            <div className="col-span-4">
              <div className={`text-sm ${isDiscrepancy ? 'font-medium text-warning-800' : 'text-gray-900'}`}>
                {formatValue(extracted)}
              </div>
            </div>

            {/* Entered Value */}
            <div className="col-span-4">
              <div className={`text-sm ${isDiscrepancy ? 'font-medium text-gray-600' : 'text-gray-900'}`}>
                {formatValue(entered)}
              </div>
            </div>

            {/* Action */}
            <div className="col-span-1">
              {isDiscrepancy && hasExtracted && (
                <button
                  onClick={() => onUseExtracted(field)}
                  className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                  title="Use extracted value"
                >
                  <ArrowIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {discrepancies.length > 0 && (
        <div className="p-4 bg-warning-50 border-t border-warning-200">
          <p className="text-sm text-warning-800">
            <strong>Tip:</strong> Click the arrow button to replace your entered value with the extracted value.
          </p>
        </div>
      )}
    </div>
  )
}
