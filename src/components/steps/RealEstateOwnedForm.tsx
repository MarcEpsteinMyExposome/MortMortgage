import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'
import {
  fakeAddress,
  fakePropertyValue,
  randomChoice,
  fakeRealEstateOwned
} from '../../lib/fake-data'

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condominium' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'two_to_four_unit', label: '2-4 Unit' },
  { value: 'manufactured', label: 'Manufactured Home' },
  { value: 'other', label: 'Other' }
] as const

const STATUS_OPTIONS = [
  { value: 'sold', label: 'Sold' },
  { value: 'pending_sale', label: 'Pending Sale' },
  { value: 'retained', label: 'Retained' }
] as const

const OCCUPANCY_OPTIONS = [
  { value: 'primary_residence', label: 'Primary Residence' },
  { value: 'second_home', label: 'Second Home' },
  { value: 'investment', label: 'Investment Property' },
  { value: 'other', label: 'Other' }
] as const

type PropertyOwned = {
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  propertyValue: number
  status: string
  intendedOccupancy: string
  propertyType: string
  monthlyInsurance: number
  monthlyTaxes: number
  monthlyHOA: number
  monthlyRentalIncome: number
  mortgages: {
    creditor: string
    monthlyPayment: number
    unpaidBalance: number
    lienType: string
    toBePaidOff: boolean
  }[]
}

const emptyProperty = (): PropertyOwned => ({
  address: { street: '', city: '', state: '', zip: '' },
  propertyValue: 0,
  status: 'retained',
  intendedOccupancy: '',
  propertyType: '',
  monthlyInsurance: 0,
  monthlyTaxes: 0,
  monthlyHOA: 0,
  monthlyRentalIncome: 0,
  mortgages: []
})

export default function RealEstateOwnedForm({ data, onUpdate, onNext, onBack, isFirst }: StepProps) {
  const [ownsRealEstate, setOwnsRealEstate] = useState(
    (data.realEstate?.propertiesOwned?.length || 0) > 0
  )
  const [properties, setProperties] = useState<PropertyOwned[]>(
    data.realEstate?.propertiesOwned || []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  function populateWithFakeData() {
    const fakeREO = fakeRealEstateOwned(2)
    if (fakeREO.propertiesOwned.length > 0) {
      setOwnsRealEstate(true)
      setProperties(fakeREO.propertiesOwned)
    } else {
      setOwnsRealEstate(false)
      setProperties([])
    }
  }

  function addProperty() {
    setProperties([...properties, emptyProperty()])
  }

  function removeProperty(index: number) {
    setProperties(properties.filter((_, i) => i !== index))
  }

  function updateProperty(index: number, field: keyof PropertyOwned, value: any) {
    const updated = [...properties]
    updated[index] = { ...updated[index], [field]: value }
    setProperties(updated)
  }

  function updatePropertyAddress(index: number, field: string, value: string) {
    const updated = [...properties]
    updated[index] = {
      ...updated[index],
      address: { ...updated[index].address, [field]: value }
    }
    setProperties(updated)
  }

  function addMortgage(propIndex: number) {
    const updated = [...properties]
    updated[propIndex].mortgages = [
      ...updated[propIndex].mortgages,
      { creditor: '', monthlyPayment: 0, unpaidBalance: 0, lienType: 'first_lien', toBePaidOff: false }
    ]
    setProperties(updated)
  }

  function removeMortgage(propIndex: number, mortIndex: number) {
    const updated = [...properties]
    updated[propIndex].mortgages = updated[propIndex].mortgages.filter((_, i) => i !== mortIndex)
    setProperties(updated)
  }

  function updateMortgage(propIndex: number, mortIndex: number, field: string, value: any) {
    const updated = [...properties]
    updated[propIndex].mortgages[mortIndex] = {
      ...updated[propIndex].mortgages[mortIndex],
      [field]: value
    }
    setProperties(updated)
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (ownsRealEstate && properties.length === 0) {
      newErrors.general = 'Please add at least one property or select "No"'
    }

    properties.forEach((prop, index) => {
      if (!prop.address.street?.trim()) {
        newErrors[`prop_${index}_street`] = 'Street address required'
      }
      if (!prop.propertyValue || prop.propertyValue <= 0) {
        newErrors[`prop_${index}_value`] = 'Property value required'
      }
      if (!prop.status) {
        newErrors[`prop_${index}_status`] = 'Status required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    onUpdate('realEstate', {
      propertiesOwned: ownsRealEstate ? properties : []
    })
    onNext()
  }

  const totalValue = properties.reduce((sum, p) => sum + (p.propertyValue || 0), 0)
  const totalMortgage = properties.reduce((sum, p) =>
    sum + p.mortgages.reduce((mSum, m) => mSum + (m.unpaidBalance || 0), 0), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Real Estate Owned</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        List all real estate you currently own or have ownership interest in.
      </p>

      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Do you own any real estate? *</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={ownsRealEstate}
              onChange={() => {
                setOwnsRealEstate(true)
                if (properties.length === 0) addProperty()
              }}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!ownsRealEstate}
              onChange={() => {
                setOwnsRealEstate(false)
                setProperties([])
              }}
            />
            <span>No</span>
          </label>
        </div>
        {errors.general && <span className="text-red-500 text-xs">{errors.general}</span>}
      </div>

      {ownsRealEstate && (
        <>
          {properties.map((property, propIndex) => (
            <div key={propIndex} className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Property {propIndex + 1}</h4>
                {properties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProperty(propIndex)}
                    className="text-sm px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                  >
                    Remove Property
                  </button>
                )}
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="flex flex-col md:col-span-2">
                  <span className="text-sm font-medium">Street Address *</span>
                  <input
                    value={property.address.street}
                    onChange={(e) => updatePropertyAddress(propIndex, 'street', e.target.value)}
                    className={`input ${errors[`prop_${propIndex}_street`] ? 'border-red-500' : ''}`}
                    placeholder="123 Main St"
                  />
                  {errors[`prop_${propIndex}_street`] && (
                    <span className="text-red-500 text-xs">{errors[`prop_${propIndex}_street`]}</span>
                  )}
                </label>

                <label className="flex flex-col">
                  <span className="text-sm font-medium">City</span>
                  <input
                    value={property.address.city}
                    onChange={(e) => updatePropertyAddress(propIndex, 'city', e.target.value)}
                    className="input"
                  />
                </label>

                <div className="flex gap-2">
                  <label className="flex flex-col flex-1">
                    <span className="text-sm font-medium">State</span>
                    <input
                      value={property.address.state}
                      onChange={(e) => updatePropertyAddress(propIndex, 'state', e.target.value)}
                      className="input"
                      maxLength={2}
                    />
                  </label>
                  <label className="flex flex-col flex-1">
                    <span className="text-sm font-medium">ZIP</span>
                    <input
                      value={property.address.zip}
                      onChange={(e) => updatePropertyAddress(propIndex, 'zip', e.target.value)}
                      className="input"
                    />
                  </label>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <label className="flex flex-col">
                  <span className="text-sm font-medium">Property Value *</span>
                  <input
                    type="number"
                    value={property.propertyValue || ''}
                    onChange={(e) => updateProperty(propIndex, 'propertyValue', parseFloat(e.target.value) || 0)}
                    className={`input ${errors[`prop_${propIndex}_value`] ? 'border-red-500' : ''}`}
                    placeholder="400000"
                  />
                  {errors[`prop_${propIndex}_value`] && (
                    <span className="text-red-500 text-xs">{errors[`prop_${propIndex}_value`]}</span>
                  )}
                </label>

                <label className="flex flex-col">
                  <span className="text-sm font-medium">Status *</span>
                  <select
                    value={property.status}
                    onChange={(e) => updateProperty(propIndex, 'status', e.target.value)}
                    className={`input ${errors[`prop_${propIndex}_status`] ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select...</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col">
                  <span className="text-sm font-medium">Occupancy</span>
                  <select
                    value={property.intendedOccupancy}
                    onChange={(e) => updateProperty(propIndex, 'intendedOccupancy', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    {OCCUPANCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col">
                  <span className="text-sm font-medium">Property Type</span>
                  <select
                    value={property.propertyType}
                    onChange={(e) => updateProperty(propIndex, 'propertyType', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    {PROPERTY_TYPES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Monthly Expenses */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <label className="flex flex-col">
                  <span className="text-sm font-medium">Monthly Insurance</span>
                  <input
                    type="number"
                    value={property.monthlyInsurance || ''}
                    onChange={(e) => updateProperty(propIndex, 'monthlyInsurance', parseFloat(e.target.value) || 0)}
                    className="input"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm font-medium">Monthly Taxes</span>
                  <input
                    type="number"
                    value={property.monthlyTaxes || ''}
                    onChange={(e) => updateProperty(propIndex, 'monthlyTaxes', parseFloat(e.target.value) || 0)}
                    className="input"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm font-medium">Monthly HOA</span>
                  <input
                    type="number"
                    value={property.monthlyHOA || ''}
                    onChange={(e) => updateProperty(propIndex, 'monthlyHOA', parseFloat(e.target.value) || 0)}
                    className="input"
                  />
                </label>
                {property.intendedOccupancy === 'investment' && (
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Monthly Rental Income</span>
                    <input
                      type="number"
                      value={property.monthlyRentalIncome || ''}
                      onChange={(e) => updateProperty(propIndex, 'monthlyRentalIncome', parseFloat(e.target.value) || 0)}
                      className="input"
                    />
                  </label>
                )}
              </div>

              {/* Mortgages */}
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Mortgages on this Property</span>
                  <button
                    type="button"
                    onClick={() => addMortgage(propIndex)}
                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    + Add Mortgage
                  </button>
                </div>

                {property.mortgages.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No mortgages (property owned free and clear)</p>
                ) : (
                  <div className="space-y-3">
                    {property.mortgages.map((mortgage, mortIndex) => (
                      <div key={mortIndex} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-2 bg-gray-50 rounded">
                        <input
                          value={mortgage.creditor}
                          onChange={(e) => updateMortgage(propIndex, mortIndex, 'creditor', e.target.value)}
                          className="input text-sm"
                          placeholder="Creditor"
                        />
                        <input
                          type="number"
                          value={mortgage.monthlyPayment || ''}
                          onChange={(e) => updateMortgage(propIndex, mortIndex, 'monthlyPayment', parseFloat(e.target.value) || 0)}
                          className="input text-sm"
                          placeholder="Monthly Payment"
                        />
                        <input
                          type="number"
                          value={mortgage.unpaidBalance || ''}
                          onChange={(e) => updateMortgage(propIndex, mortIndex, 'unpaidBalance', parseFloat(e.target.value) || 0)}
                          className="input text-sm"
                          placeholder="Balance"
                        />
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={mortgage.toBePaidOff}
                            onChange={(e) => updateMortgage(propIndex, mortIndex, 'toBePaidOff', e.target.checked)}
                          />
                          <span>Pay off at closing</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeMortgage(propIndex, mortIndex)}
                          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addProperty}
            className="mb-4 text-sm px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300"
          >
            + Add Another Property
          </button>

          {/* Summary */}
          {properties.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Properties:</span>
                  <span className="ml-2 font-medium">{properties.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <span className="ml-2 font-medium">${totalValue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Mortgage Balance:</span>
                  <span className="ml-2 font-medium">${totalMortgage.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Equity:</span>
                  <span className="ml-2 font-medium">${(totalValue - totalMortgage).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </>
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
