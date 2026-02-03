import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'
import { fakeAssets } from '../../lib/fake-data'

const ASSET_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'investment', label: 'Investment/Brokerage' },
  { value: 'retirement', label: 'Retirement (401k, IRA)' },
  { value: 'cash_value_life', label: 'Cash Value Life Insurance' },
  { value: 'other', label: 'Other' }
]

type Asset = {
  type: string
  institution: string
  accountNumber: string
  balance: number
}

export default function AssetsForm({ data, onUpdate, onNext, onBack }: StepProps) {
  const existingAssets = data.assets?.assets || []

  const [assets, setAssets] = useState<Asset[]>(
    existingAssets.length > 0 ? existingAssets : []
  )

  function populateWithFakeData() {
    setAssets(fakeAssets())
  }

  function addAsset() {
    setAssets([...assets, {
      type: 'checking',
      institution: '',
      accountNumber: '',
      balance: 0
    }])
  }

  function updateAsset(index: number, field: keyof Asset, value: any) {
    const updated = [...assets]
    updated[index] = { ...updated[index], [field]: value }
    setAssets(updated)
  }

  function removeAsset(index: number) {
    setAssets(assets.filter((_, i) => i !== index))
  }

  function getTotalAssets(): number {
    return assets.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
  }

  function handleSave() {
    onUpdate('assets', {
      assets: assets.map(a => ({
        ...a,
        institution: a.institution.trim(),
        accountNumber: a.accountNumber.trim(),
        balance: Number(a.balance)
      }))
    })
    onNext()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Assets</h3>
        <button
          type="button"
          onClick={populateWithFakeData}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
        >
          Populate with Fake Data
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        List your bank accounts, investments, and other assets.
      </p>

      {assets.length === 0 && (
        <p className="text-gray-500 italic mb-4">No assets added yet.</p>
      )}

      {assets.map((asset, index) => (
        <div key={index} className="border rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Asset {index + 1}</h4>
            <button
              type="button"
              onClick={() => removeAsset(index)}
              className="text-red-600 text-sm hover:underline"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm font-medium">Account Type</span>
              <select
                value={asset.type}
                onChange={(e) => updateAsset(index, 'type', e.target.value)}
                className="input"
              >
                {ASSET_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Financial Institution</span>
              <input
                value={asset.institution}
                onChange={(e) => updateAsset(index, 'institution', e.target.value)}
                className="input"
                placeholder="Bank of America"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Account Number (last 4)</span>
              <input
                value={asset.accountNumber}
                onChange={(e) => updateAsset(index, 'accountNumber', e.target.value)}
                className="input"
                placeholder="****1234"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Balance</span>
              <input
                type="number"
                min="0"
                value={asset.balance || ''}
                onChange={(e) => updateAsset(index, 'balance', e.target.value)}
                className="input"
                placeholder="10000"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addAsset}
        className="text-blue-600 hover:underline text-sm mb-4"
      >
        + Add Asset
      </button>

      {assets.length > 0 && (
        <div className="bg-gray-50 p-3 rounded mb-4">
          <span className="font-medium">Total Assets: </span>
          <span className="text-green-600">${getTotalAssets().toLocaleString()}</span>
        </div>
      )}

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
