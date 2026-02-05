import React, { useState } from 'react'
import type { DocumentExtraction, ExtractedField } from '../../lib/ocr/types'

interface ExtractionResultsProps {
  extraction: DocumentExtraction
  fieldConfidences?: Record<string, number>
  defaultExpanded?: boolean
}

// Field labels for each document type
const FIELD_LABELS: Record<string, Record<string, string>> = {
  w2: {
    employerName: 'Employer Name',
    employerEIN: 'Employer EIN',
    employerAddress: 'Employer Address',
    employeeName: 'Employee Name',
    employeeSSN: 'Employee SSN (Last 4)',
    wagesTipsCompensation: 'Wages, Tips, Compensation (Box 1)',
    federalIncomeTaxWithheld: 'Federal Income Tax Withheld (Box 2)',
    socialSecurityWages: 'Social Security Wages (Box 3)',
    medicareWages: 'Medicare Wages (Box 5)',
    taxYear: 'Tax Year'
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
    ytdNetPay: 'YTD Net Pay'
  },
  bank_statement: {
    institutionName: 'Bank Name',
    accountType: 'Account Type',
    accountNumberLast4: 'Account Number (Last 4)',
    statementPeriodStart: 'Statement Period Start',
    statementPeriodEnd: 'Statement Period End',
    beginningBalance: 'Beginning Balance',
    endingBalance: 'Ending Balance',
    totalDeposits: 'Total Deposits',
    totalWithdrawals: 'Total Withdrawals'
  }
}

function formatValue(value: string | number | null): string {
  if (value === null || value === undefined) return '---'
  if (typeof value === 'number') {
    // Format as currency if it looks like money
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }
  return String(value)
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-500'
  if (confidence >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-1.5" title={`${Math.round(confidence)}% confidence`}>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getConfidenceColor(confidence)} transition-all`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{Math.round(confidence)}%</span>
    </div>
  )
}

export default function ExtractionResults({
  extraction,
  fieldConfidences,
  defaultExpanded = false
}: ExtractionResultsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const docType = extraction.documentType
  const labels = FIELD_LABELS[docType] || {}

  // Get fields to display (exclude documentType and rawText)
  const displayFields = Object.entries(extraction)
    .filter(([key]) => key !== 'documentType' && key !== 'rawText' && key !== 'detectedFields')
    .filter(([_, value]) => value !== null && value !== undefined)

  if (displayFields.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No fields extracted from this document.
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          Extracted Fields ({displayFields.length})
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Field</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Value</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium w-24">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayFields.map(([key, value]) => {
                const field = value as ExtractedField
                const label = labels[key] || key.replace(/([A-Z])/g, ' $1').trim()
                const confidence = fieldConfidences?.[key] ?? field?.confidence ?? 0
                const displayValue = typeof field === 'object' && field !== null && 'value' in field
                  ? field.value
                  : field

                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{label}</td>
                    <td className="px-3 py-2 font-medium">{formatValue(displayValue as string | number | null)}</td>
                    <td className="px-3 py-2">
                      <ConfidenceIndicator confidence={confidence} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
