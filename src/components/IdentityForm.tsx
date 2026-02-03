import React, { useState } from 'react'
import type { URLABorrower } from '../types/urla-borrower'

type Props = {
  initial?: Partial<URLABorrower>
  onSubmit: (borrower: URLABorrower) => Promise<void>
}

export default function IdentityForm({ initial = {}, onSubmit }: Props) {
  const [firstName, setFirstName] = useState(initial.name?.firstName || '')
  const [middleName, setMiddleName] = useState(initial.name?.middleName || '')
  const [lastName, setLastName] = useState(initial.name?.lastName || '')
  const [ssn, setSsn] = useState(initial.ssn || '')
  const [dob, setDob] = useState(initial.dob || '')
  const [employer, setEmployer] = useState(initial.employment?.employer || '')
  const [income, setIncome] = useState((initial.employment?.income ?? '') as any)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required')
      return false
    }
    if (ssn && !/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
      setError('SSN must be in format XXX-XX-XXXX')
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)

    const borrower: URLABorrower = {
      borrowerType: 'primary',
      name: { firstName: firstName.trim(), middleName: middleName.trim() || undefined, lastName: lastName.trim() },
      ssn: ssn || undefined,
      dob: dob || undefined,
      employment: { employer: employer || undefined, income: income ? Number(income) : undefined }
    }

    try {
      await onSubmit(borrower)
    } catch (err: any) {
      setError(err?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Borrower Identity</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col">
          <span className="text-sm">First name</span>
          <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Middle name</span>
          <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Last name</span>
          <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">SSN</span>
          <input placeholder="123-45-6789" value={ssn} onChange={(e) => setSsn(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Date of birth</span>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Employer</span>
          <input value={employer} onChange={(e) => setEmployer(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col col-span-2">
          <span className="text-sm">Income (annual)</span>
          <input type="number" value={income as any} onChange={(e) => setIncome(e.target.value)} className="input" />
        </label>
      </div>

      <div className="mt-4">
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save & Continue'}</button>
      </div>
    </form>
  )
}
