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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Name Section */}
      <div>
        <h3 className="section-title flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Legal Name
        </h3>
        <p className="section-subtitle">Enter your name exactly as it appears on your ID</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="label">
              First Name <span className="text-danger-500">*</span>
            </label>
            <input
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Middle Name</label>
            <input
              placeholder="Michael"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">
              Last Name <span className="text-danger-500">*</span>
            </label>
            <input
              placeholder="Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>
      </div>

      {/* Personal Details Section */}
      <div>
        <h3 className="section-title flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          Personal Details
        </h3>
        <p className="section-subtitle">This information helps verify your identity</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">
              Social Security Number
              <span className="text-xs text-gray-400 font-normal ml-2">(Format: XXX-XX-XXXX)</span>
            </label>
            <div className="relative">
              <input
                placeholder="123-45-6789"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                className="input pl-10"
                type="password"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Employment Section */}
      <div>
        <h3 className="section-title flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Employment Information
        </h3>
        <p className="section-subtitle">Your current employment details (optional for now)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Current Employer</label>
            <input
              placeholder="Company Name"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Annual Income</label>
            <div className="relative">
              <input
                type="number"
                placeholder="75000"
                value={income as any}
                onChange={(e) => setIncome(e.target.value)}
                className="input pl-8"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">$</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Section */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 order-2 sm:order-1">
            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            You can complete additional details in the next steps
          </p>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg order-1 sm:order-2 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Application...
              </>
            ) : (
              <>
                Save & Continue
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
