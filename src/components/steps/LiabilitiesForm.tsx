import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'

const LIABILITY_TYPES = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'heloc', label: 'Home Equity Line of Credit' },
  { value: 'installment', label: 'Installment Loan' },
  { value: 'other', label: 'Other' }
]

type Liability = {
  type: string
  creditor: string
  monthlyPayment: number
  balance: number
  toBePaidOff: boolean
}

export default function LiabilitiesForm({ data, onUpdate, onNext, onBack }: StepProps) {
  const existingLiabilities = data.liabilities?.liabilities || []

  const [liabilities, setLiabilities] = useState<Liability[]>(
    existingLiabilities.length > 0 ? existingLiabilities : []
  )

  function addLiability() {
    setLiabilities([...liabilities, {
      type: 'credit_card',
      creditor: '',
      monthlyPayment: 0,
      balance: 0,
      toBePaidOff: false
    }])
  }

  function updateLiability(index: number, field: keyof Liability, value: any) {
    const updated = [...liabilities]
    updated[index] = { ...updated[index], [field]: value }
    setLiabilities(updated)
  }

  function removeLiability(index: number) {
    setLiabilities(liabilities.filter((_, i) => i !== index))
  }

  function getTotalMonthly(): number {
    return liabilities
      .filter(l => !l.toBePaidOff)
      .reduce((sum, l) => sum + (Number(l.monthlyPayment) || 0), 0)
  }

  function getTotalBalance(): number {
    return liabilities.reduce((sum, l) => sum + (Number(l.balance) || 0), 0)
  }

  function handleSave() {
    onUpdate('liabilities', {
      liabilities: liabilities.map(l => ({
        ...l,
        creditor: l.creditor.trim(),
        monthlyPayment: Number(l.monthlyPayment),
        balance: Number(l.balance)
      }))
    })
    onNext()
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
      <p className="text-sm text-gray-600 mb-4">
        List your debts including mortgages, credit cards, and loans.
      </p>

      {liabilities.length === 0 && (
        <p className="text-gray-500 italic mb-4">No liabilities added yet.</p>
      )}

      {liabilities.map((liability, index) => (
        <div key={index} className="border rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Liability {index + 1}</h4>
            <button
              type="button"
              onClick={() => removeLiability(index)}
              className="text-red-600 text-sm hover:underline"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm font-medium">Type</span>
              <select
                value={liability.type}
                onChange={(e) => updateLiability(index, 'type', e.target.value)}
                className="input"
              >
                {LIABILITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Creditor</span>
              <input
                value={liability.creditor}
                onChange={(e) => updateLiability(index, 'creditor', e.target.value)}
                className="input"
                placeholder="Chase Bank"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Monthly Payment</span>
              <input
                type="number"
                min="0"
                value={liability.monthlyPayment || ''}
                onChange={(e) => updateLiability(index, 'monthlyPayment', e.target.value)}
                className="input"
                placeholder="250"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Unpaid Balance</span>
              <input
                type="number"
                min="0"
                value={liability.balance || ''}
                onChange={(e) => updateLiability(index, 'balance', e.target.value)}
                className="input"
                placeholder="5000"
              />
            </label>

            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={liability.toBePaidOff}
                onChange={(e) => updateLiability(index, 'toBePaidOff', e.target.checked)}
              />
              <span className="text-sm">To be paid off at/before closing</span>
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addLiability}
        className="text-blue-600 hover:underline text-sm mb-4"
      >
        + Add Liability
      </button>

      {liabilities.length > 0 && (
        <div className="bg-gray-50 p-3 rounded mb-4 space-y-1">
          <div>
            <span className="font-medium">Total Monthly Payments: </span>
            <span className="text-red-600">${getTotalMonthly().toLocaleString()}/mo</span>
          </div>
          <div>
            <span className="font-medium">Total Balance: </span>
            <span className="text-red-600">${getTotalBalance().toLocaleString()}</span>
          </div>
        </div>
      )}

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
