import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'

export default function IdentityStep({ data, borrowerIndex, onUpdate, onNext, onBack, isFirst }: StepProps) {
  const borrower = data.borrowers?.[borrowerIndex] || {}
  const name = borrower.name || {}

  const [firstName, setFirstName] = useState(name.firstName || '')
  const [middleName, setMiddleName] = useState(name.middleName || '')
  const [lastName, setLastName] = useState(name.lastName || '')
  const [suffix, setSuffix] = useState(name.suffix || '')
  const [ssn, setSsn] = useState(borrower.ssn || '')
  const [dob, setDob] = useState(borrower.dob || '')
  const [citizenship, setCitizenship] = useState(borrower.citizenship || '')
  const [maritalStatus, setMaritalStatus] = useState(borrower.maritalStatus || '')
  const [email, setEmail] = useState(borrower.contact?.email || '')
  const [cellPhone, setCellPhone] = useState(borrower.contact?.cellPhone || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (ssn && !/^\d{3}-\d{2}-\d{4}$/.test(ssn)) newErrors.ssn = 'SSN must be XXX-XX-XXXX format'
    if (!citizenship) newErrors.citizenship = 'Citizenship status is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    const updatedBorrowers = [...(data.borrowers || [])]
    updatedBorrowers[borrowerIndex] = {
      ...updatedBorrowers[borrowerIndex],
      borrowerType: borrowerIndex === 0 ? 'borrower' : 'co_borrower',
      name: {
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        suffix: suffix || undefined
      },
      ssn: ssn || undefined,
      dob: dob || undefined,
      citizenship,
      maritalStatus: maritalStatus || undefined,
      contact: {
        email: email.trim() || undefined,
        cellPhone: cellPhone.trim() || undefined
      }
    }

    onUpdate('borrowers', updatedBorrowers)
    onNext()
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Borrower Identity</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">First Name *</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`input ${errors.firstName ? 'border-red-500' : ''}`}
            placeholder="John"
          />
          {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Middle Name</span>
          <input
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Last Name *</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`input ${errors.lastName ? 'border-red-500' : ''}`}
            placeholder="Doe"
          />
          {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Suffix</span>
          <select value={suffix} onChange={(e) => setSuffix(e.target.value)} className="input">
            <option value="">None</option>
            <option value="Jr">Jr</option>
            <option value="Sr">Sr</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Social Security Number</span>
          <input
            value={ssn}
            onChange={(e) => setSsn(e.target.value)}
            className={`input ${errors.ssn ? 'border-red-500' : ''}`}
            placeholder="123-45-6789"
          />
          {errors.ssn && <span className="text-red-500 text-xs">{errors.ssn}</span>}
          <span className="text-xs text-gray-500">Demo only - use synthetic data</span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Date of Birth</span>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Citizenship Status *</span>
          <select
            value={citizenship}
            onChange={(e) => setCitizenship(e.target.value)}
            className={`input ${errors.citizenship ? 'border-red-500' : ''}`}
          >
            <option value="">Select status</option>
            <option value="us_citizen">U.S. Citizen</option>
            <option value="permanent_resident">Permanent Resident Alien</option>
            <option value="non_permanent_resident">Non-Permanent Resident Alien</option>
          </select>
          {errors.citizenship && <span className="text-red-500 text-xs">{errors.citizenship}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Marital Status</span>
          <select
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value)}
            className="input"
          >
            <option value="">Select status</option>
            <option value="married">Married</option>
            <option value="separated">Separated</option>
            <option value="unmarried">Unmarried (single, divorced, widowed)</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="john@example.com"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Cell Phone</span>
          <input
            value={cellPhone}
            onChange={(e) => setCellPhone(e.target.value)}
            className="input"
            placeholder="555-123-4567"
          />
        </label>
      </div>

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
