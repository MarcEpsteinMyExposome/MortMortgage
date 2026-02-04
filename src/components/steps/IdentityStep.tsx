import React, { useState, useEffect } from 'react'
import type { StepProps } from '../ApplicationWizard'
import BorrowerTabs from '../BorrowerTabs'
import {
  fakeName,
  fakeSSN,
  fakeDOB,
  fakeEmail,
  fakePhone,
  fakeDependents,
  fakeAlternateNames,
  randomChoice
} from '../../lib/fake-data'

// Extended StepProps to include co-borrower state
export interface IdentityStepProps extends StepProps {
  hasCoBorrower?: boolean
  activeBorrowerIndex?: number
  onToggleCoBorrower?: (enabled: boolean) => void
  onBorrowerIndexChange?: (index: number) => void
}

export default function IdentityStep({
  data,
  borrowerIndex: propBorrowerIndex,
  onUpdate,
  onNext,
  onBack,
  isFirst,
  hasCoBorrower: propHasCoBorrower,
  activeBorrowerIndex: propActiveBorrowerIndex,
  onToggleCoBorrower,
  onBorrowerIndexChange
}: IdentityStepProps) {
  // Use props if provided, otherwise manage state internally
  const [internalHasCoBorrower, setInternalHasCoBorrower] = useState(
    data.borrowers?.length > 1
  )
  const [internalActiveBorrowerIndex, setInternalActiveBorrowerIndex] = useState(0)

  const hasCoBorrower = propHasCoBorrower !== undefined ? propHasCoBorrower : internalHasCoBorrower
  const activeBorrowerIndex = propActiveBorrowerIndex !== undefined ? propActiveBorrowerIndex : internalActiveBorrowerIndex
  const borrowerIndex = hasCoBorrower ? activeBorrowerIndex : 0

  const borrower = data.borrowers?.[borrowerIndex] || {}
  const name = borrower.name || {}
  const deps = borrower.dependents || { count: 0, ages: [] }

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

  // Dependents
  const [dependentCount, setDependentCount] = useState(deps.count || 0)
  const [dependentAges, setDependentAges] = useState<number[]>(deps.ages || [])

  // Alternate names (maiden name, aliases)
  const [alternateNames, setAlternateNames] = useState<string[]>(borrower.alternateNames || [])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when switching between borrowers
  useEffect(() => {
    const currentBorrower = data.borrowers?.[borrowerIndex] || {}
    const currentName = currentBorrower.name || {}
    const currentDeps = currentBorrower.dependents || { count: 0, ages: [] }

    setFirstName(currentName.firstName || '')
    setMiddleName(currentName.middleName || '')
    setLastName(currentName.lastName || '')
    setSuffix(currentName.suffix || '')
    setSsn(currentBorrower.ssn || '')
    setDob(currentBorrower.dob || '')
    setCitizenship(currentBorrower.citizenship || '')
    setMaritalStatus(currentBorrower.maritalStatus || '')
    setEmail(currentBorrower.contact?.email || '')
    setCellPhone(currentBorrower.contact?.cellPhone || '')
    setDependentCount(currentDeps.count || 0)
    setDependentAges(currentDeps.ages || [])
    setAlternateNames(currentBorrower.alternateNames || [])
    setErrors({})
  }, [borrowerIndex, data.borrowers])

  function handleToggleCoBorrower(enabled: boolean) {
    if (onToggleCoBorrower) {
      onToggleCoBorrower(enabled)
    } else {
      setInternalHasCoBorrower(enabled)
    }

    // Initialize co-borrower data structure if enabling
    if (enabled && (!data.borrowers || data.borrowers.length < 2)) {
      const updatedBorrowers = [...(data.borrowers || [])]
      // Ensure primary borrower exists
      if (updatedBorrowers.length === 0) {
        updatedBorrowers.push({ borrowerType: 'borrower' })
      }
      // Add co-borrower placeholder
      updatedBorrowers.push({ borrowerType: 'co_borrower' })
      onUpdate('borrowers', updatedBorrowers)
    }

    // Remove co-borrower data if disabling
    if (!enabled && data.borrowers?.length > 1) {
      const updatedBorrowers = [data.borrowers[0]]
      onUpdate('borrowers', updatedBorrowers)
      // Reset to primary borrower tab
      if (onBorrowerIndexChange) {
        onBorrowerIndexChange(0)
      } else {
        setInternalActiveBorrowerIndex(0)
      }
    }
  }

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
    const fakeName_ = fakeName()
    setFirstName(fakeName_.firstName)
    setMiddleName(fakeName_.middleName)
    setLastName(fakeName_.lastName)
    setSuffix(fakeName_.suffix)
    setSsn(fakeSSN())
    setDob(fakeDOB())
    setCitizenship(randomChoice(['us_citizen', 'permanent_resident', 'non_permanent_resident'] as const))
    setMaritalStatus(randomChoice(['married', 'separated', 'unmarried'] as const))
    setEmail(fakeEmail(fakeName_.firstName, fakeName_.lastName))
    setCellPhone(fakePhone())

    const fakeDeps = fakeDependents()
    setDependentCount(fakeDeps.count)
    setDependentAges(fakeDeps.ages)

    setAlternateNames(fakeAlternateNames())
  }

  function handleDependentCountChange(count: number) {
    setDependentCount(count)
    // Adjust ages array to match count
    if (count > dependentAges.length) {
      setDependentAges([...dependentAges, ...Array(count - dependentAges.length).fill(0)])
    } else {
      setDependentAges(dependentAges.slice(0, count))
    }
  }

  function handleDependentAgeChange(index: number, age: number) {
    const updated = [...dependentAges]
    updated[index] = age
    setDependentAges(updated)
  }

  function addAlternateName() {
    setAlternateNames([...alternateNames, ''])
  }

  function removeAlternateName(index: number) {
    setAlternateNames(alternateNames.filter((_, i) => i !== index))
  }

  function updateAlternateName(index: number, value: string) {
    const updated = [...alternateNames]
    updated[index] = value
    setAlternateNames(updated)
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (ssn && !/^\d{3}-\d{2}-\d{4}$/.test(ssn)) newErrors.ssn = 'SSN must be XXX-XX-XXXX format'
    if (!citizenship) newErrors.citizenship = 'Citizenship status is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateBothBorrowers(): boolean {
    if (!hasCoBorrower) return validate()

    // Validate current borrower
    const currentValid = validate()
    if (!currentValid) return false

    // Check if the other borrower has required data
    const otherIndex = borrowerIndex === 0 ? 1 : 0
    const otherBorrower = data.borrowers?.[otherIndex] || {}
    const otherName = otherBorrower.name || {}

    if (!otherName.firstName?.trim() || !otherName.lastName?.trim() || !otherBorrower.citizenship) {
      // Switch to the other tab and show error
      alert(`Please complete the required fields for the ${otherIndex === 0 ? 'Primary Borrower' : 'Co-Borrower'}`)
      handleTabChange(otherIndex)
      return false
    }

    return true
  }

  function saveCurrentBorrower() {
    const updatedBorrowers = [...(data.borrowers || [])]

    // Ensure we have enough borrower slots
    while (updatedBorrowers.length <= borrowerIndex) {
      updatedBorrowers.push({ borrowerType: updatedBorrowers.length === 0 ? 'borrower' : 'co_borrower' })
    }

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
      },
      dependents: dependentCount > 0 ? {
        count: dependentCount,
        ages: dependentAges.slice(0, dependentCount)
      } : undefined,
      alternateNames: alternateNames.filter(n => n.trim()).length > 0
        ? alternateNames.filter(n => n.trim())
        : undefined
    }

    onUpdate('borrowers', updatedBorrowers)
  }

  function handleSave() {
    if (!validate()) return

    saveCurrentBorrower()

    // If we have a co-borrower, validate both before proceeding
    if (hasCoBorrower) {
      // We need to check the other borrower after saving current
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

    const isPrimaryValid = !!(
      primaryBorrower.name?.firstName?.trim() &&
      primaryBorrower.name?.lastName?.trim() &&
      primaryBorrower.citizenship
    )

    const isCoBorrowerValid = !hasCoBorrower || !!(
      coBorrower.name?.firstName?.trim() &&
      coBorrower.name?.lastName?.trim() &&
      coBorrower.citizenship
    )

    return {
      primary: isPrimaryValid,
      coBorrower: isCoBorrowerValid
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Borrower Identity</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>

      {/* Co-Borrower Toggle and Tabs */}
      <BorrowerTabs
        hasCoBorrower={hasCoBorrower}
        activeBorrowerIndex={borrowerIndex}
        onTabChange={handleTabChange}
        onToggleCoBorrower={handleToggleCoBorrower}
        showToggle={true}
        borrowerValidation={getBorrowerValidation()}
      />

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

      {/* Dependents Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-medium mb-3">Dependents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Number of Dependents</span>
            <input
              type="number"
              min="0"
              max="10"
              value={dependentCount}
              onChange={(e) => handleDependentCountChange(parseInt(e.target.value) || 0)}
              className="input"
            />
          </label>
        </div>
        {dependentCount > 0 && (
          <div className="mt-3">
            <span className="text-sm font-medium">Ages of Dependents</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {Array.from({ length: dependentCount }).map((_, index) => (
                <input
                  key={index}
                  type="number"
                  min="0"
                  max="99"
                  value={dependentAges[index] || 0}
                  onChange={(e) => handleDependentAgeChange(index, parseInt(e.target.value) || 0)}
                  className="input w-20"
                  placeholder={`Age ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alternate Names Section */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium">Alternate Names</h4>
          <button
            type="button"
            onClick={addAlternateName}
            className="text-sm px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          >
            + Add Name
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">Maiden name, aliases, or other names used</p>
        {alternateNames.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No alternate names added</p>
        ) : (
          <div className="space-y-2">
            {alternateNames.map((altName, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={altName}
                  onChange={(e) => updateAlternateName(index, e.target.value)}
                  className="input flex-1"
                  placeholder="Enter alternate name"
                />
                <button
                  type="button"
                  onClick={() => removeAlternateName(index)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
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
