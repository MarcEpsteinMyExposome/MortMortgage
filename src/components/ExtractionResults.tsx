import React, { useState } from 'react'

interface Props {
  documentType: string;
  extractedFields: Record<string, { value: any; confidence: number }>;
  onFieldEdit?: (field: string, value: any) => void;
}

const ChevronIcon = ({ expanded, className }: { expanded: boolean; className?: string }) => (
  <svg
    className={`transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${className || 'w-5 h-5'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

// Human-readable field labels by document type
const FIELD_LABELS: Record<string, Record<string, string>> = {
  w2: {
    employerName: 'Employer Name',
    employerEIN: 'Employer EIN',
    employerAddress: 'Employer Address',
    employeeName: 'Employee Name',
    employeeSSN: 'Employee SSN (Last 4)',
    wagesTipsCompensation: 'Wages, Tips & Compensation (Box 1)',
    federalIncomeTaxWithheld: 'Federal Income Tax Withheld (Box 2)',
    socialSecurityWages: 'Social Security Wages (Box 3)',
    medicareWages: 'Medicare Wages (Box 5)',
    taxYear: 'Tax Year',
  },
  paystub: {
    employerName: 'Employer Name',
    employeeName: 'Employee Name',
    payPeriodStart: 'Pay Period Start',
    payPeriodEnd: 'Pay Period End',
    payDate: 'Pay Date',
    grossPay: 'Gross Pay',
    netPay: 'Net Pay',
    ytdGrossPay: 'YTD Gross Pay',
    ytdNetPay: 'YTD Net Pay',
  },
  bank_statement: {
    institutionName: 'Financial Institution',
    accountType: 'Account Type',
    accountNumberLast4: 'Account Number (Last 4)',
    statementPeriodStart: 'Statement Period Start',
    statementPeriodEnd: 'Statement Period End',
    beginningBalance: 'Beginning Balance',
    endingBalance: 'Ending Balance',
    totalDeposits: 'Total Deposits',
    totalWithdrawals: 'Total Withdrawals',
  },
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  w2: 'W-2 Form',
  paystub: 'Pay Stub',
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  id: 'Government ID',
  other: 'Document',
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 90) {
    return 'bg-success-100 text-success-800'
  } else if (confidence >= 70) {
    return 'bg-warning-100 text-warning-800'
  }
  return 'bg-danger-100 text-danger-800'
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    // Check if it looks like currency
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

function getFieldLabel(documentType: string, fieldKey: string): string {
  return FIELD_LABELS[documentType]?.[fieldKey] || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

export default function ExtractionResults({ documentType, extractedFields, onFieldEdit }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const fieldEntries = Object.entries(extractedFields).filter(
    ([key]) => key !== 'documentType'
  )

  if (fieldEntries.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-sm text-gray-500">No data was extracted from this document.</p>
      </div>
    )
  }

  const handleEditClick = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditValue(currentValue?.toString() || '')
  }

  const handleEditSave = (field: string) => {
    if (onFieldEdit) {
      onFieldEdit(field, editValue)
    }
    setEditingField(null)
    setEditValue('')
  }

  const handleEditCancel = () => {
    setEditingField(null)
    setEditValue('')
  }

  const documentLabel = DOCUMENT_TYPE_LABELS[documentType] || 'Extracted Data'

  return (
    <div className="card overflow-hidden">
      {/* Header - Collapsible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-semibold text-gray-900">{documentLabel}</span>
          <span className="text-sm text-gray-500">({fieldEntries.length} fields)</span>
        </div>
        <ChevronIcon expanded={expanded} className="w-5 h-5 text-gray-500" />
      </button>

      {/* Content */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {fieldEntries.map(([field, data]) => (
            <div key={field} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {getFieldLabel(documentType, field)}
                  </p>
                  {editingField === field ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input py-1.5 text-sm flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSave(field)}
                        className="btn btn-primary btn-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-900 font-medium truncate">
                      {formatValue(data.value)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${getConfidenceBadge(data.confidence)}`}>
                    {data.confidence}%
                  </span>
                  {onFieldEdit && editingField !== field && (
                    <button
                      onClick={() => handleEditClick(field, data.value)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit value"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
