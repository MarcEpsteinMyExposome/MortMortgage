import React, { useState, useEffect } from 'react'
import type { StepProps } from '../ApplicationWizard'
import BorrowerTabs from '../BorrowerTabs'
import { fakeEmployment } from '../../lib/fake-data'
import { BankConnectionSection } from '../PlaidLink'
import type { ConnectedBankAccount } from '../../lib/integrations/plaid'

type Employment = {
  current: boolean
  employerName: string
  position: string
  startDate: string
  endDate?: string
  selfEmployed: boolean
  monthlyIncome: number
}

type PlaidConnection = ConnectedBankAccount | null

// Extended StepProps to include co-borrower state
export interface EmploymentFormProps extends StepProps {
  hasCoBorrower?: boolean
  activeBorrowerIndex?: number
  onBorrowerIndexChange?: (index: number) => void
}

export default function EmploymentForm({
  data,
  borrowerIndex: propBorrowerIndex,
  onUpdate,
  onNext,
  onBack,
  hasCoBorrower: propHasCoBorrower,
  activeBorrowerIndex: propActiveBorrowerIndex,
  onBorrowerIndexChange
}: EmploymentFormProps) {
  // Determine if co-borrower exists from data
  const hasCoBorrower = propHasCoBorrower !== undefined
    ? propHasCoBorrower
    : (data.borrowers?.length > 1)

  const [internalActiveBorrowerIndex, setInternalActiveBorrowerIndex] = useState(0)
  const activeBorrowerIndex = propActiveBorrowerIndex !== undefined
    ? propActiveBorrowerIndex
    : internalActiveBorrowerIndex
  const borrowerIndex = hasCoBorrower ? activeBorrowerIndex : 0

  const borrower = data.borrowers?.[borrowerIndex] || {}
  const existingEmployment = borrower.employment || []
  const existingPlaidConnection = borrower.plaidConnection || null

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

  const [plaidConnection, setPlaidConnection] = useState<PlaidConnection>(existingPlaidConnection)
  const [plaidLoading, setPlaidLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showManualEntry, setShowManualEntry] = useState(!existingPlaidConnection)

  // Generate a user ID for Plaid (in production, use actual user ID)
  const userId = borrower.ssn ? `user-${borrower.ssn.slice(-4)}` : `user-${Date.now()}`

  // Reset form when switching between borrowers
  useEffect(() => {
    const currentBorrower = data.borrowers?.[borrowerIndex] || {}
    const currentEmployment = currentBorrower.employment || []
    const currentPlaidConnection = currentBorrower.plaidConnection || null

    setEmployments(
      currentEmployment.length > 0 ? currentEmployment : [{
        current: true,
        employerName: '',
        position: '',
        startDate: '',
        selfEmployed: false,
        monthlyIncome: 0
      }]
    )
    setPlaidConnection(currentPlaidConnection)
    setShowManualEntry(!currentPlaidConnection)
    setErrors({})
  }, [borrowerIndex, data.borrowers])

  function handleTabChange(index: number) {
    // Save current borrower data before switching
    saveCurrentBorrower()

    if (onBorrowerIndexChange) {
      onBorrowerIndexChange(index)
    } else {
      setInternalActiveBorrowerIndex(index)
    }
  }

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
    setShowManualEntry(true)
  }

  function handlePlaidConnect(connectionData: ConnectedBankAccount) {
    setPlaidConnection(connectionData)
    setPlaidLoading(false)

    // If income is verified, auto-populate monthly income
    if (connectionData.incomeVerified && connectionData.verifiedAnnualIncome) {
      const monthlyIncome = Math.round(connectionData.verifiedAnnualIncome / 12)
      const currentEmployment = employments.find(e => e.current)
      if (currentEmployment && (!currentEmployment.monthlyIncome || currentEmployment.monthlyIncome === 0)) {
        updateEmployment(0, 'monthlyIncome', monthlyIncome)
      }
    }
  }

  async function handlePlaidDisconnect() {
    if (!plaidConnection) return

    setPlaidLoading(true)
    try {
      await fetch('/api/plaid/get-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: plaidConnection.accessToken }),
      })
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
    setPlaidConnection(null)
    setPlaidLoading(false)
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    // If Plaid connection with verified income exists and no manual entry, allow proceeding
    if (plaidConnection?.incomeVerified && !showManualEntry) {
      setErrors({})
      return true
    }

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

  function validateBothBorrowers(): boolean {
    if (!hasCoBorrower) return validate()

    // Validate current borrower
    const currentValid = validate()
    if (!currentValid) return false

    // Check if the other borrower has required employment data
    const otherIndex = borrowerIndex === 0 ? 1 : 0
    const otherBorrower = data.borrowers?.[otherIndex] || {}

    // Check if other borrower has Plaid verified income
    if (otherBorrower.plaidConnection?.incomeVerified) {
      return true
    }

    const otherEmployment = Array.isArray(otherBorrower.employment) ? otherBorrower.employment : []
    const otherCurrent = otherEmployment.find((e: any) => e.current)

    if (!otherCurrent?.employerName?.trim() || !otherCurrent?.monthlyIncome || otherCurrent.monthlyIncome <= 0) {
      alert(`Please complete the employment for the ${otherIndex === 0 ? 'Primary Borrower' : 'Co-Borrower'}`)
      handleTabChange(otherIndex)
      return false
    }

    return true
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

  function saveCurrentBorrower() {
    const updatedBorrowers = [...(data.borrowers || [])]

    // Ensure we have enough borrower slots
    while (updatedBorrowers.length <= borrowerIndex) {
      updatedBorrowers.push({ borrowerType: updatedBorrowers.length === 0 ? 'borrower' : 'co_borrower' })
    }

    updatedBorrowers[borrowerIndex] = {
      ...updatedBorrowers[borrowerIndex],
      employment: employments.map(e => ({
        ...e,
        employerName: e.employerName.trim(),
        position: e.position?.trim() || undefined,
        monthlyIncome: Number(e.monthlyIncome)
      })),
      plaidConnection: plaidConnection ? {
        itemId: plaidConnection.itemId,
        institutionName: plaidConnection.institutionName,
        accounts: plaidConnection.accounts?.map(a => ({
          accountId: a.account_id,
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
          currentBalance: a.balances?.current ?? 0,
          verificationStatus: a.verification_status,
        })) || [],
        incomeVerified: plaidConnection.incomeVerified,
        verifiedAnnualIncome: plaidConnection.verifiedAnnualIncome,
        connectedAt: plaidConnection.connectedAt,
      } : null,
    }

    onUpdate('borrowers', updatedBorrowers)
  }

  function handleSave() {
    if (!validate()) return

    saveCurrentBorrower()

    // If we have a co-borrower, validate both before proceeding
    if (hasCoBorrower) {
      setTimeout(() => {
        if (validateBothBorrowers()) {
          onNext()
        }
      }, 100)
    } else {
      onNext()
    }
  }

  // Calculate validation status for both borrowers
  function getBorrowerValidation() {
    const primaryBorrower = data.borrowers?.[0] || {}
    const coBorrower = data.borrowers?.[1] || {}

    // Check if primary has Plaid verified income or manual employment
    const isPrimaryValid = primaryBorrower.plaidConnection?.incomeVerified || (() => {
      const primaryEmployment = Array.isArray(primaryBorrower.employment) ? primaryBorrower.employment : []
      const primaryCurrent = primaryEmployment.find((e: any) => e.current)
      return !!(primaryCurrent?.employerName?.trim() && primaryCurrent?.monthlyIncome > 0)
    })()

    // Check if co-borrower has Plaid verified income or manual employment
    const isCoBorrowerValid = !hasCoBorrower || coBorrower.plaidConnection?.incomeVerified || (() => {
      const coBorrowerEmployment = Array.isArray(coBorrower.employment) ? coBorrower.employment : []
      const coBorrowerCurrent = coBorrowerEmployment.find((e: any) => e.current)
      return !!(coBorrowerCurrent?.employerName?.trim() && coBorrowerCurrent?.monthlyIncome > 0)
    })()

    return {
      primary: isPrimaryValid,
      coBorrower: isCoBorrowerValid
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '---'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

      {/* Borrower Tabs - no toggle here, just tabs for switching */}
      {hasCoBorrower && (
        <BorrowerTabs
          hasCoBorrower={hasCoBorrower}
          activeBorrowerIndex={borrowerIndex}
          onTabChange={handleTabChange}
          onToggleCoBorrower={() => {}} // No toggle on employment step
          showToggle={false}
          borrowerValidation={getBorrowerValidation()}
        />
      )}

      <p className="text-sm text-gray-600 mb-4">
        Connect your bank to verify income instantly, or enter your employment details manually.
      </p>

      {/* Plaid Bank Connection Section */}
      <div className="mb-6">
        <BankConnectionSection
          userId={userId}
          connection={plaidConnection}
          onConnect={handlePlaidConnect}
          onDisconnect={handlePlaidDisconnect}
          loading={plaidLoading}
        />

        {/* Verified Income Display */}
        {plaidConnection?.incomeVerified && plaidConnection.verifiedAnnualIncome && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-800">Income Verified</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Annual Income:</span>
                <span className="ml-2 font-bold text-green-700">
                  {formatCurrency(plaidConnection.verifiedAnnualIncome)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Monthly Income:</span>
                <span className="ml-2 font-bold text-green-700">
                  {formatCurrency(Math.round(plaidConnection.verifiedAnnualIncome / 12))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider with manual entry toggle */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <button
            type="button"
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="px-4 py-1 bg-white text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showManualEntry ? 'Hide manual entry' : 'Or enter manually below'}
          </button>
        </div>
      </div>

      {/* Manual Employment Entry Section */}
      {showManualEntry && (
        <>
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
        </>
      )}

      {/* Sandbox Test Credentials Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium text-blue-800 mb-1">Plaid Sandbox Test Credentials:</p>
        <ul className="text-blue-700 space-y-0.5">
          <li>Username: <code className="bg-blue-100 px-1 rounded">user_good</code></li>
          <li>Password: <code className="bg-blue-100 px-1 rounded">pass_good</code></li>
          <li>MFA code (if prompted): <code className="bg-blue-100 px-1 rounded">1234</code></li>
        </ul>
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
