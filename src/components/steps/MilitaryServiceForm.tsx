import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'
import { fakeMilitaryService, randomChoice } from '../../lib/fake-data'

const SERVICE_STATUS_OPTIONS = [
  { value: 'currently_serving', label: 'Currently serving on active duty' },
  { value: 'expired_less_than_90_days', label: 'Currently serving, tour will expire in less than 90 days' },
  { value: 'retired_discharged_separated', label: 'Retired, discharged, or separated from service' },
  { value: 'surviving_spouse', label: 'Surviving spouse of veteran' },
  { value: 'never_served', label: 'I have not served in the military' }
] as const

export default function MilitaryServiceForm({ data, borrowerIndex, onUpdate, onNext, onBack, isFirst }: StepProps) {
  const borrower = data.borrowers?.[borrowerIndex] || {}
  const military = borrower.militaryService || {}

  const [status, setStatus] = useState(military.status || '')
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(military.expectedCompletionDate || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  function populateWithFakeData() {
    const fakeMilitary = fakeMilitaryService()
    setStatus(fakeMilitary.status)
    setExpectedCompletionDate(fakeMilitary.expectedCompletionDate || '')
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!status) {
      newErrors.status = 'Please select your military service status'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    const updatedBorrowers = [...(data.borrowers || [])]
    updatedBorrowers[borrowerIndex] = {
      ...updatedBorrowers[borrowerIndex],
      militaryService: {
        status,
        expectedCompletionDate: status === 'expired_less_than_90_days' ? expectedCompletionDate : undefined
      }
    }

    onUpdate('borrowers', updatedBorrowers)
    onNext()
  }

  const showCompletionDate = status === 'expired_less_than_90_days' || status === 'currently_serving'
  const isVeteran = ['currently_serving', 'expired_less_than_90_days', 'retired_discharged_separated', 'surviving_spouse'].includes(status)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Military Service</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        This information helps determine eligibility for VA loan benefits.
      </p>

      <div className="space-y-3">
        <p className="text-sm font-medium">Did you (or your deceased spouse) ever serve in the U.S. Armed Forces? *</p>

        {SERVICE_STATUS_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="militaryStatus"
              value={option.value}
              checked={status === option.value}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-0.5"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}

        {errors.status && <span className="text-red-500 text-xs">{errors.status}</span>}
      </div>

      {showCompletionDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Expected Tour Completion Date</span>
            <input
              type="date"
              value={expectedCompletionDate}
              onChange={(e) => setExpectedCompletionDate(e.target.value)}
              className="input mt-1 max-w-xs"
            />
          </label>
        </div>
      )}

      {isVeteran && status !== 'never_served' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 mb-2">VA Loan Eligibility</h4>
          <p className="text-sm text-green-700">
            Based on your military service, you may be eligible for a VA loan. VA loans offer competitive
            interest rates, no down payment requirements, and no private mortgage insurance (PMI).
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="btn bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Back
        </button>
        <button type="button" onClick={handleSave} className="btn">
          Save & Continue
        </button>
      </div>
    </div>
  )
}
