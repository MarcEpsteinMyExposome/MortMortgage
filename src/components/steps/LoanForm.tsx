import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'

const LOAN_PURPOSES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'other', label: 'Other' }
]

const LOAN_TYPES = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda_rural_housing', label: 'USDA Rural Housing' }
]

const LOAN_TERMS = [
  { value: 360, label: '30 Year' },
  { value: 240, label: '20 Year' },
  { value: 180, label: '15 Year' },
  { value: 120, label: '10 Year' }
]

const DOWN_PAYMENT_SOURCES = [
  { value: 'checking_savings', label: 'Checking/Savings' },
  { value: 'gift', label: 'Gift' },
  { value: 'grant', label: 'Grant' },
  { value: 'equity_on_property_sold', label: 'Equity on Property Being Sold' },
  { value: 'employer_assistance', label: 'Employer Assistance' },
  { value: 'other', label: 'Other' }
]

export default function LoanForm({ data, onUpdate, onNext, onBack }: StepProps) {
  const loan = data.loan || {}
  const downPayment = loan.downPayment || {}

  const [loanPurpose, setLoanPurpose] = useState(loan.loanPurpose || '')
  const [loanType, setLoanType] = useState(loan.loanType || 'conventional')
  const [loanAmount, setLoanAmount] = useState(loan.loanAmount || '')
  const [loanTermMonths, setLoanTermMonths] = useState(loan.loanTermMonths || 360)
  const [interestRateType, setInterestRateType] = useState(loan.interestRateType || 'fixed')

  const [downPaymentAmount, setDownPaymentAmount] = useState(downPayment.amount || '')
  const [downPaymentSource, setDownPaymentSource] = useState(downPayment.source || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const propertyValue = data.property?.propertyValue || 0

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!loanPurpose) newErrors.loanPurpose = 'Loan purpose is required'
    if (!loanType) newErrors.loanType = 'Loan type is required'
    if (!loanAmount || Number(loanAmount) <= 0) newErrors.loanAmount = 'Loan amount is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function calculateLTV(): string {
    if (propertyValue > 0 && Number(loanAmount) > 0) {
      const ltv = (Number(loanAmount) / propertyValue) * 100
      return ltv.toFixed(1) + '%'
    }
    return '-'
  }

  function handleSave() {
    if (!validate()) return

    onUpdate('loan', {
      loanPurpose,
      loanType,
      loanAmount: Number(loanAmount),
      loanTermMonths: Number(loanTermMonths),
      interestRateType,
      downPayment: {
        amount: Number(downPaymentAmount) || undefined,
        source: downPaymentSource || undefined
      }
    })
    onNext()
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Loan Information</h3>
      <p className="text-sm text-gray-600 mb-4">
        Specify the loan details for your mortgage application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Loan Purpose *</span>
          <select
            value={loanPurpose}
            onChange={(e) => setLoanPurpose(e.target.value)}
            className={`input ${errors.loanPurpose ? 'border-red-500' : ''}`}
          >
            <option value="">Select purpose</option>
            {LOAN_PURPOSES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {errors.loanPurpose && <span className="text-red-500 text-xs">{errors.loanPurpose}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Loan Type *</span>
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className={`input ${errors.loanType ? 'border-red-500' : ''}`}
          >
            {LOAN_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.loanType && <span className="text-red-500 text-xs">{errors.loanType}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Loan Amount *</span>
          <input
            type="number"
            min="0"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className={`input ${errors.loanAmount ? 'border-red-500' : ''}`}
            placeholder="280000"
          />
          {errors.loanAmount && <span className="text-red-500 text-xs">{errors.loanAmount}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Loan Term</span>
          <select
            value={loanTermMonths}
            onChange={(e) => setLoanTermMonths(e.target.value)}
            className="input"
          >
            {LOAN_TERMS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Interest Rate Type</span>
          <select
            value={interestRateType}
            onChange={(e) => setInterestRateType(e.target.value)}
            className="input"
          >
            <option value="fixed">Fixed Rate</option>
            <option value="adjustable">Adjustable Rate (ARM)</option>
          </select>
        </label>
      </div>

      <h4 className="font-medium mt-6 mb-3">Down Payment</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Down Payment Amount</span>
          <input
            type="number"
            min="0"
            value={downPaymentAmount}
            onChange={(e) => setDownPaymentAmount(e.target.value)}
            className="input"
            placeholder="70000"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Source of Down Payment</span>
          <select
            value={downPaymentSource}
            onChange={(e) => setDownPaymentSource(e.target.value)}
            className="input"
          >
            <option value="">Select source</option>
            {DOWN_PAYMENT_SOURCES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded mt-6">
        <h4 className="font-medium mb-2">Loan Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>Property Value:</span>
          <span>${propertyValue.toLocaleString()}</span>

          <span>Loan Amount:</span>
          <span>${Number(loanAmount || 0).toLocaleString()}</span>

          <span>Down Payment:</span>
          <span>${Number(downPaymentAmount || 0).toLocaleString()}</span>

          <span>LTV Ratio:</span>
          <span className={Number(calculateLTV().replace('%', '')) > 80 ? 'text-orange-600' : 'text-green-600'}>
            {calculateLTV()}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button type="button" onClick={onBack} className="btn bg-gray-200 text-gray-700">
          Back
        </button>
        <button type="button" onClick={handleSave} className="btn">
          Save & Continue
        </button>
      </div>
    </div>
  )
}
