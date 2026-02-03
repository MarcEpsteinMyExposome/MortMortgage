import React, { useState, useEffect } from 'react'
import type { StepProps } from '../ApplicationWizard'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]

export default function AddressForm({ data, borrowerIndex, onUpdate, onNext, onBack, isFirst }: StepProps) {
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

  function handleSave() {
    if (!validate()) return

    const updatedBorrowers = [...(data.borrowers || [])]
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
        durationYears: durationYears ? Number(durationYears) : undefined,
        durationMonths: durationMonths ? Number(durationMonths) : undefined
      }
    }

    onUpdate('borrowers', updatedBorrowers)
    onNext()
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Current Address</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col col-span-2">
          <span className="text-sm font-medium">Street Address *</span>
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={`input ${errors.street ? 'border-red-500' : ''}`}
            placeholder="123 Main St"
          />
          {errors.street && <span className="text-red-500 text-xs">{errors.street}</span>}
        </label>

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
