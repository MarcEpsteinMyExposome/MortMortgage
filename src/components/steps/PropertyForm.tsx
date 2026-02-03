import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'
import { fakeAddress, fakePropertyValue, randomChoice } from '../../lib/fake-data'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'two_to_four_unit', label: '2-4 Unit' },
  { value: 'manufactured_home', label: 'Manufactured Home' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'pud', label: 'PUD' }
]

const OCCUPANCY_TYPES = [
  { value: 'primary_residence', label: 'Primary Residence' },
  { value: 'second_home', label: 'Second Home' },
  { value: 'investment', label: 'Investment Property' }
]

export default function PropertyForm({ data, onUpdate, onNext, onBack }: StepProps) {
  const property = data.property || {}
  const address = property.address || {}

  const [street, setStreet] = useState(address.street || '')
  const [unit, setUnit] = useState(address.unit || '')
  const [city, setCity] = useState(address.city || '')
  const [state, setState] = useState(address.state || '')
  const [zip, setZip] = useState(address.zip || '')
  const [county, setCounty] = useState(address.county || '')

  const [propertyType, setPropertyType] = useState(property.propertyType || '')
  const [numberOfUnits, setNumberOfUnits] = useState(property.numberOfUnits || 1)
  const [propertyValue, setPropertyValue] = useState(property.propertyValue || '')
  const [occupancy, setOccupancy] = useState(property.occupancy || '')
  const [yearBuilt, setYearBuilt] = useState(property.yearBuilt || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  function populateWithFakeData() {
    const fakeAddr = fakeAddress()
    setStreet(fakeAddr.street)
    setUnit(fakeAddr.unit)
    setCity(fakeAddr.city)
    setState(fakeAddr.state)
    setZip(fakeAddr.zip)
    setCounty(fakeAddr.county)
    setPropertyType(randomChoice(PROPERTY_TYPES.map(p => p.value)))
    setNumberOfUnits(Math.floor(Math.random() * 4) + 1)
    setPropertyValue(String(fakePropertyValue()))
    setOccupancy(randomChoice(OCCUPANCY_TYPES.map(o => o.value)))
    setYearBuilt(String(Math.floor(Math.random() * 73) + 1950))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!street.trim()) newErrors.street = 'Street address is required'
    if (!city.trim()) newErrors.city = 'City is required'
    if (!state) newErrors.state = 'State is required'
    if (!zip.trim()) newErrors.zip = 'ZIP code is required'
    else if (!/^\d{5}(-\d{4})?$/.test(zip)) newErrors.zip = 'Invalid ZIP format'
    if (!propertyType) newErrors.propertyType = 'Property type is required'
    if (!propertyValue || Number(propertyValue) <= 0) newErrors.propertyValue = 'Property value is required'
    if (!occupancy) newErrors.occupancy = 'Occupancy type is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    onUpdate('property', {
      address: {
        street: street.trim(),
        unit: unit.trim() || undefined,
        city: city.trim(),
        state,
        zip: zip.trim(),
        county: county.trim() || undefined
      },
      propertyType,
      numberOfUnits: Number(numberOfUnits),
      propertyValue: Number(propertyValue),
      occupancy,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined
    })
    onNext()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Subject Property</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Enter information about the property you are purchasing or refinancing.
      </p>

      <h4 className="font-medium mb-3">Property Address</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <label className="flex flex-col col-span-2">
          <span className="text-sm font-medium">Street Address *</span>
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={`input ${errors.street ? 'border-red-500' : ''}`}
            placeholder="456 Oak Avenue"
          />
          {errors.street && <span className="text-red-500 text-xs">{errors.street}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Unit/Apt</span>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} className="input" />
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
          />
          {errors.zip && <span className="text-red-500 text-xs">{errors.zip}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">County</span>
          <input value={county} onChange={(e) => setCounty(e.target.value)} className="input" />
        </label>
      </div>

      <h4 className="font-medium mb-3">Property Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Property Type *</span>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className={`input ${errors.propertyType ? 'border-red-500' : ''}`}
          >
            <option value="">Select type</option>
            {PROPERTY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.propertyType && <span className="text-red-500 text-xs">{errors.propertyType}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Number of Units</span>
          <select
            value={numberOfUnits}
            onChange={(e) => setNumberOfUnits(e.target.value)}
            className="input"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Property Value / Purchase Price *</span>
          <input
            type="number"
            min="0"
            value={propertyValue}
            onChange={(e) => setPropertyValue(e.target.value)}
            className={`input ${errors.propertyValue ? 'border-red-500' : ''}`}
            placeholder="350000"
          />
          {errors.propertyValue && <span className="text-red-500 text-xs">{errors.propertyValue}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Occupancy *</span>
          <select
            value={occupancy}
            onChange={(e) => setOccupancy(e.target.value)}
            className={`input ${errors.occupancy ? 'border-red-500' : ''}`}
          >
            <option value="">Select occupancy</option>
            {OCCUPANCY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.occupancy && <span className="text-red-500 text-xs">{errors.occupancy}</span>}
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium">Year Built</span>
          <input
            type="number"
            min="1800"
            max={new Date().getFullYear()}
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value)}
            className="input"
            placeholder="2005"
          />
        </label>
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
