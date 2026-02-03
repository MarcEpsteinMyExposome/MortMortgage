import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'
import { fakeEmployment } from '../../lib/fake-data'

type Employment = {
  current: boolean
  employerName: string
  position: string
  startDate: string
  endDate?: string
  selfEmployed: boolean
  monthlyIncome: number
}

export default function EmploymentForm({ data, borrowerIndex, onUpdate, onNext, onBack }: StepProps) {
  const borrower = data.borrowers?.[borrowerIndex] || {}
  const existingEmployment = borrower.employment || []

  const [employments, setEmployments] = useState<Employment[]>(
    existingEmployment.length > 0 ? existingEmployment : [{
      current: true,
      employerName: '',
      position: '',
      startDate: '',
      selfEmployed: false,
      monthlyIncome: 0
    }]
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  function populateWithFakeData() {
    const fake = fakeEmployment()
    setEmployments([{
      current: true,
      employerName: fake.employerName,
      position: fake.position,
      startDate: fake.startDate,
      selfEmployed: fake.selfEmployed,
      monthlyIncome: fake.monthlyIncome
    }])
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    const current = employments.find(e => e.current)

    if (!current?.employerName?.trim()) {
      newErrors.employerName = 'Current employer name is required'
    }
    if (!current?.monthlyIncome || current.monthlyIncome <= 0) {
      newErrors.monthlyIncome = 'Monthly income is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function updateEmployment(index: number, field: keyof Employment, value: any) {
    const updated = [...employments]
    updated[index] = { ...updated[index], [field]: value }
    setEmployments(updated)
  }

  function addEmployment() {
    setEmployments([...employments, {
      current: false,
      employerName: '',
      position: '',
      startDate: '',
      selfEmployed: false,
      monthlyIncome: 0
    }])
  }

  function removeEmployment(index: number) {
    if (employments.length > 1) {
      setEmployments(employments.filter((_, i) => i !== index))
    }
  }

  function handleSave() {
    if (!validate()) return

    const updatedBorrowers = [...(data.borrowers || [])]
    updatedBorrowers[borrowerIndex] = {
      ...updatedBorrowers[borrowerIndex],
      employment: employments.map(e => ({
        ...e,
        employerName: e.employerName.trim(),
        position: e.position?.trim() || undefined,
        monthlyIncome: Number(e.monthlyIncome)
      }))
    }

    onUpdate('borrowers', updatedBorrowers)
    onNext()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Employment & Income</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Provide your current employment and any previous employers if less than 2 years at current job.
      </p>

      {employments.map((emp, index) => (
        <div key={index} className="border rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">
              {emp.current ? 'Current Employment' : `Previous Employment ${index}`}
            </h4>
            {employments.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmployment(index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm font-medium">Employer Name *</span>
              <input
                value={emp.employerName}
                onChange={(e) => updateEmployment(index, 'employerName', e.target.value)}
                className={`input ${index === 0 && errors.employerName ? 'border-red-500' : ''}`}
                placeholder="Company Inc."
              />
              {index === 0 && errors.employerName && (
                <span className="text-red-500 text-xs">{errors.employerName}</span>
              )}
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Position/Title</span>
              <input
                value={emp.position}
                onChange={(e) => updateEmployment(index, 'position', e.target.value)}
                className="input"
                placeholder="Software Engineer"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Start Date</span>
              <input
                type="date"
                value={emp.startDate}
                onChange={(e) => updateEmployment(index, 'startDate', e.target.value)}
                className="input"
              />
            </label>

            {!emp.current && (
              <label className="flex flex-col">
                <span className="text-sm font-medium">End Date</span>
                <input
                  type="date"
                  value={emp.endDate || ''}
                  onChange={(e) => updateEmployment(index, 'endDate', e.target.value)}
                  className="input"
                />
              </label>
            )}

            <label className="flex flex-col">
              <span className="text-sm font-medium">Monthly Income *</span>
              <input
                type="number"
                min="0"
                value={emp.monthlyIncome || ''}
                onChange={(e) => updateEmployment(index, 'monthlyIncome', e.target.value)}
                className={`input ${index === 0 && errors.monthlyIncome ? 'border-red-500' : ''}`}
                placeholder="5000"
              />
              {index === 0 && errors.monthlyIncome && (
                <span className="text-red-500 text-xs">{errors.monthlyIncome}</span>
              )}
            </label>

            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={emp.selfEmployed}
                onChange={(e) => updateEmployment(index, 'selfEmployed', e.target.checked)}
              />
              <span className="text-sm">Self-employed</span>
            </label>

            {index > 0 && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emp.current}
                  onChange={(e) => updateEmployment(index, 'current', e.target.checked)}
                />
                <span className="text-sm">This is current employment</span>
              </label>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEmployment}
        className="text-blue-600 hover:underline text-sm mb-4"
      >
        + Add Previous Employment
      </button>

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
