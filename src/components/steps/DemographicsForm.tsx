import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'
import { fakeDemographics } from '../../lib/fake-data'

const ETHNICITY_OPTIONS = [
  { value: 'hispanic_or_latino', label: 'Hispanic or Latino' },
  { value: 'not_hispanic_or_latino', label: 'Not Hispanic or Latino' },
  { value: 'prefer_not_to_answer', label: 'I do not wish to provide this information' }
]

const RACE_OPTIONS = [
  { value: 'american_indian_alaska_native', label: 'American Indian or Alaska Native' },
  { value: 'asian', label: 'Asian' },
  { value: 'black_african_american', label: 'Black or African American' },
  { value: 'native_hawaiian_pacific_islander', label: 'Native Hawaiian or Other Pacific Islander' },
  { value: 'white', label: 'White' },
  { value: 'prefer_not_to_answer', label: 'I do not wish to provide this information' }
]

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_answer', label: 'I do not wish to provide this information' }
]

export default function DemographicsForm({ data, borrowerIndex, onUpdate, onNext, onBack, isLast }: StepProps) {
  const demographics = data.demographics || {}

  const [ethnicity, setEthnicity] = useState(demographics.ethnicity || '')
  const [race, setRace] = useState<string[]>(demographics.race || [])
  const [sex, setSex] = useState(demographics.sex || '')

  function toggleRace(value: string) {
    if (value === 'prefer_not_to_answer') {
      setRace(['prefer_not_to_answer'])
    } else {
      const filtered = race.filter(r => r !== 'prefer_not_to_answer')
      if (filtered.includes(value)) {
        setRace(filtered.filter(r => r !== value))
      } else {
        setRace([...filtered, value])
      }
    }
  }

  function populateWithFakeData() {
    const fake = fakeDemographics()
    setEthnicity(fake.ethnicity)
    setRace(fake.race)
    setSex(fake.sex)
  }

  function handleSave() {
    onUpdate('demographics', {
      ethnicity: ethnicity || undefined,
      race: race.length > 0 ? race : undefined,
      sex: sex || undefined
    })
    onNext()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Demographic Information</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        The following information is requested by the Federal Government for certain types of loans
        in order to monitor the lender's compliance with equal credit opportunity, fair housing, and
        home mortgage disclosure laws. This information is optional.
      </p>

      <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm mb-6">
        You are not required to furnish this information, but are encouraged to do so.
        You may select one or more designations for "Race." The law provides that a lender
        may not discriminate on the basis of this information.
      </div>

      {/* Ethnicity */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Ethnicity</h4>
        <div className="space-y-2">
          {ETHNICITY_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="ethnicity"
                checked={ethnicity === opt.value}
                onChange={() => setEthnicity(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Race */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Race (select one or more)</h4>
        <div className="space-y-2">
          {RACE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={race.includes(opt.value)}
                onChange={() => toggleRace(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sex */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Sex</h4>
        <div className="space-y-2">
          {SEX_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="sex"
                checked={sex === opt.value}
                onChange={() => setSex(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button type="button" onClick={onBack} className="btn bg-gray-200 text-gray-700">
          Back
        </button>
        <button type="button" onClick={handleSave} className="btn">
          {isLast ? 'Complete Application' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
