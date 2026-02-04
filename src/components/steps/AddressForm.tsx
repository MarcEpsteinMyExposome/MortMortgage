import React, { useState, useEffect } from 'react'
import type { StepProps } from '../ApplicationWizard'
import BorrowerTabs from '../BorrowerTabs'
import { fakeAddress, fakeMonthlyRent, randomChoice } from '../../lib/fake-data'
import AddressAutocomplete, { ParsedAddress } from '../AddressAutocomplete'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]

// Extended StepProps to include co-borrower state
export interface AddressFormProps extends StepProps {
  hasCoBorrower?: boolean
  activeBorrowerIndex?: number
  onBorrowerIndexChange?: (index: number) => void
}

export default function AddressForm({
  data,
  borrowerIndex: propBorrowerIndex,
  onUpdate,
  onNext,
  onBack,
  isFirst,
  hasCoBorrower: propHasCoBorrower,
  activeBorrowerIndex: propActiveBorrowerIndex,
  onBorrowerIndexChange
}: AddressFormProps) {
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
  const currentAddress = borrower.currentAddress || {}
  const address = currentAddress.address || {}

  const [street, setStreet] = useState(address.street || '')
  const [unit, setUnit] = useState(address.unit || '')
  const [city, setCity] = useState(address.city || '')
  const [state, setState] = useState(address.state || '')
  const [zip, setZip] = useState(address.zip || '')
  const [housingType, setHousingType] = useState(currentAddress.housingType || '')
  const [monthlyRent, setMonthlyRent] = useState(currentAddress.monthlyRent || '')
  const [durationYears, setDurationYears] = useState(currentAddress.durationYears || '')
  const [durationMonths, setDurationMonths] = useState(currentAddress.durationMonths || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when switching between borrowers
  useEffect(() => {
    const currentBorrower = data.borrowers?.[borrowerIndex] || {}
    const currentAddressData = currentBorrower.currentAddress || {}
    const addressData = currentAddressData.address || {}

    setStreet(addressData.street || '')
    setUnit(addressData.unit || '')
    setCity(addressData.city || '')
    setState(addressData.state || '')
    setZip(addressData.zip || '')
    setHousingType(currentAddressData.housingType || '')
    setMonthlyRent(currentAddressData.monthlyRent || '')
    setDurationYears(currentAddressData.durationYears || '')
    setDurationMonths(currentAddressData.durationMonths || '')
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
    const fakeAddr = fakeAddress()
    setStreet(fakeAddr.street)
    setUnit(fakeAddr.unit)
    setCity(fakeAddr.city)
    setState(fakeAddr.state)
    setZip(fakeAddr.zip)
    const housing = randomChoice(['own', 'rent', 'no_primary_expense'] as const)
    setHousingType(housing)
    setMonthlyRent(housing === 'rent' ? String(fakeMonthlyRent()) : '')
    setDurationYears(String(Math.floor(Math.random() * 10)))
    setDurationMonths(String(Math.floor(Math.random() * 12)))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!street.trim()) newErrors.street = 'Street address is required'
    if (!city.trim()) newErrors.city = 'City is required'
    if (!state) newErrors.state = 'State is required'
    if (!zip.trim()) newErrors.zip = 'ZIP code is required'
    else if (!/^\d{5}(-\d{4})?$/.test(zip)) newErrors.zip = 'Invalid ZIP format'
    if (!housingType) newErrors.housingType = 'Housing type is required'
    if (housingType === 'rent' && !monthlyRent) newErrors.monthlyRent = 'Monthly rent is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateBothBorrowers(): boolean {
    if (!hasCoBorrower) return validate()

    // Validate current borrower
    const currentValid = validate()
    if (!currentValid) return false

    // Check if the other borrower has required address data
    const otherIndex = borrowerIndex === 0 ? 1 : 0
    const otherBorrower = data.borrowers?.[otherIndex] || {}
    const otherAddress = otherBorrower.currentAddress?.address || {}

    if (!otherAddress.street?.trim() || !otherAddress.city?.trim() ||
        !otherAddress.state || !otherAddress.zip?.trim() ||
        !otherBorrower.currentAddress?.housingType) {
      alert(`Please complete the address for the ${otherIndex === 0 ? 'Primary Borrower' : 'Co-Borrower'}`)
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
      currentAddress: {
        address: {
          street: street.trim(),
          unit: unit.trim() || undefined,
          city: city.trim(),
          state,
          zip: zip.trim(),
          country: 'US'
        },
        housingType,
        monthlyRent: housingType === 'rent' ? Number(monthlyRent) : undefined,
        monthlyPayment: housingType !== 'no_primary_expense' ? Number(monthlyRent) || 0 : 0,
        durationYears: durationYears ? Number(durationYears) : undefined,
        durationMonths: durationMonths ? Number(durationMonths) : undefined
      }
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

    const isPrimaryValid = !!(
      primaryBorrower.currentAddress?.address?.street?.trim() &&
      primaryBorrower.currentAddress?.address?.city?.trim() &&
      primaryBorrower.currentAddress?.address?.state &&
      primaryBorrower.currentAddress?.address?.zip?.trim() &&
      primaryBorrower.currentAddress?.housingType
    )

    const isCoBorrowerValid = !hasCoBorrower || !!(
      coBorrower.currentAddress?.address?.street?.trim() &&
      coBorrower.currentAddress?.address?.city?.trim() &&
      coBorrower.currentAddress?.address?.state &&
      coBorrower.currentAddress?.address?.zip?.trim() &&
      coBorrower.currentAddress?.housingType
    )

    return {
      primary: isPrimaryValid,
      coBorrower: isCoBorrowerValid
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Current Address</h3>
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
          onToggleCoBorrower={() => {}} // No toggle on address step
          showToggle={false}
          borrowerValidation={getBorrowerValidation()}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col col-span-2">
          <span className="text-sm font-medium">Street Address *</span>
          <AddressAutocomplete
            value={street}
            onChange={setStreet}
            onSelect={(addr: ParsedAddress) => {
              setStreet(addr.street)
              setCity(addr.city)
              setState(addr.state)
              setZip(addr.zip)
            }}
            placeholder="Start typing address..."
            error={errors.street}
          />
          {errors.street && <span className="text-red-500 text-xs">{errors.street}</span>}
        </div>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Unit/Apt</span>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input"
            placeholder="Apt 4B"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">City *</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`input ${errors.city ? 'border-red-500' : ''}`}
          />
          {errors.city && <span className="text-red-500 text-xs">{errors.city}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">State *</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={`input ${errors.state ? 'border-red-500' : ''}`}
          >
            <option value="">Select state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <span className="text-red-500 text-xs">{errors.state}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">ZIP Code *</span>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className={`input ${errors.zip ? 'border-red-500' : ''}`}
            placeholder="12345"
          />
          {errors.zip && <span className="text-red-500 text-xs">{errors.zip}</span>}
        </label>
      </div>

      <h4 className="text-md font-semibold mt-6 mb-4">Housing Information</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Housing Type *</span>
          <select
            value={housingType}
            onChange={(e) => setHousingType(e.target.value)}
            className={`input ${errors.housingType ? 'border-red-500' : ''}`}
          >
            <option value="">Select type</option>
            <option value="own">Own</option>
            <option value="rent">Rent</option>
            <option value="no_primary_expense">Living rent-free</option>
          </select>
          {errors.housingType && <span className="text-red-500 text-xs">{errors.housingType}</span>}
        </label>

        {housingType === 'rent' && (
          <label className="flex flex-col">
            <span className="text-sm font-medium">Monthly Rent *</span>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className={`input ${errors.monthlyRent ? 'border-red-500' : ''}`}
              placeholder="1500"
            />
            {errors.monthlyRent && <span className="text-red-500 text-xs">{errors.monthlyRent}</span>}
          </label>
        )}

        <label className="flex flex-col">
          <span className="text-sm font-medium">Time at Address (Years)</span>
          <input
            type="number"
            min="0"
            value={durationYears}
            onChange={(e) => setDurationYears(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Months</span>
          <input
            type="number"
            min="0"
            max="11"
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            className="input"
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
        <button
          type="button"
          onClick={handleSave}
          className="btn"
        >
          Save & Continue
        </button>
      </div>
    </div>
  )
}
