import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { UnderwritingData } from '../../../types/underwriting'
import {
  getCreditRiskBadge,
  getDTIRiskBadge,
  getLTVRiskBadge,
  getIncomeRiskBadge,
  getPropertyConfidenceRiskBadge,
  calculateQualification,
  getQualificationBadge,
  formatCurrency,
  formatPercent,
  formatDateTime
} from '../../../lib/underwriting-utils'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'pending_documents', label: 'Pending Documents', color: 'bg-orange-100 text-orange-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'denied', label: 'Denied', color: 'bg-red-100 text-red-800' }
]

export default function AdminAppDetail() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [app, setApp] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Underwriting state
  const [underwriting, setUnderwriting] = useState<UnderwritingData>({})
  const [uwLoading, setUwLoading] = useState<{
    credit: boolean
    income: boolean
    property: boolean
    pricing: boolean
  }>({ credit: false, income: false, property: false, pricing: false })

  useEffect(() => {
    if (!id) return

    async function loadApp() {
      try {
        const res = await fetch(`/api/apps/${id}`)
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setApp(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadApp()
  }, [id])

  async function handleStatusChange(newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setApp(updated)
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleExport(format: 'json' | 'xml') {
    setExporting(true)
    try {
      const res = await fetch(`/api/apps/${id}/export?format=${format}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `loan-${id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    setExporting(true)
    try {
      const res = await fetch(`/api/apps/${id}/pdf`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'PDF export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `URLA-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err?.message || 'PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  // Underwriting Integration Handlers
  async function handleCreditPull() {
    if (!borrower.ssn) {
      alert('Borrower SSN is required for credit pull')
      return
    }
    setUwLoading(prev => ({ ...prev, credit: true }))
    try {
      const res = await fetch('/api/integrations/credit-pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssn: borrower.ssn,
          firstName: borrower.name?.firstName || '',
          lastName: borrower.name?.lastName || '',
          dateOfBirth: borrower.dob,
          currentAddress: borrower.currentAddress?.address
        })
      })
      if (!res.ok) throw new Error('Credit pull failed')
      const result = await res.json()
      setUnderwriting(prev => ({
        ...prev,
        credit: { result, pulledAt: new Date().toISOString() }
      }))
    } catch (err: any) {
      alert(err?.message || 'Credit pull failed')
    } finally {
      setUwLoading(prev => ({ ...prev, credit: false }))
    }
  }

  async function handleIncomeVerify() {
    const employment = Array.isArray(borrower.employment) ? borrower.employment[0] : null
    if (!employment || !borrower.ssn) {
      alert('Employment and SSN required for income verification')
      return
    }
    setUwLoading(prev => ({ ...prev, income: true }))
    try {
      const res = await fetch('/api/integrations/verify-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerName: employment.employerName || '',
          jobTitle: employment.position || '',
          statedAnnualIncome: (employment.monthlyIncome || 0) * 12,
          ssn: borrower.ssn,
          startDate: employment.startDate,
          employmentType: 'W2'
        })
      })
      if (!res.ok) throw new Error('Income verification failed')
      const result = await res.json()
      setUnderwriting(prev => ({
        ...prev,
        income: { result, verifiedAt: new Date().toISOString() }
      }))
    } catch (err: any) {
      alert(err?.message || 'Income verification failed')
    } finally {
      setUwLoading(prev => ({ ...prev, income: false }))
    }
  }

  async function handlePropertyValue() {
    if (!property.address) {
      alert('Property address is required for valuation')
      return
    }
    setUwLoading(prev => ({ ...prev, property: true }))
    try {
      const res = await fetch('/api/integrations/property-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: property.address.street || '',
          city: property.address.city || '',
          state: property.address.state || '',
          zip: property.address.zip || '',
          propertyType: property.propertyType || 'single_family',
          squareFeet: property.squareFeet,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms
        })
      })
      if (!res.ok) throw new Error('Property valuation failed')
      const result = await res.json()
      setUnderwriting(prev => ({
        ...prev,
        property: { result, valuedAt: new Date().toISOString() }
      }))
    } catch (err: any) {
      alert(err?.message || 'Property valuation failed')
    } finally {
      setUwLoading(prev => ({ ...prev, property: false }))
    }
  }

  async function handlePricing() {
    if (!underwriting.credit) {
      alert('Run credit pull first to get pricing')
      return
    }
    setUwLoading(prev => ({ ...prev, pricing: true }))
    try {
      const loanAmount = loan.loanAmount || 0
      const propertyValue = underwriting.property?.result.valuation.estimatedValue || property.propertyValue || 0

      // Map snake_case to PascalCase for API
      const occupancyMap: Record<string, string> = {
        primary_residence: 'PrimaryResidence',
        second_home: 'SecondHome',
        investment: 'Investment'
      }
      const propertyTypeMap: Record<string, string> = {
        single_family: 'SingleFamily',
        condo: 'Condo',
        townhouse: 'Townhouse',
        multi_family: 'MultiFamily',
        manufactured: 'Manufactured'
      }

      const res = await fetch('/api/integrations/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount,
          propertyValue,
          creditScore: underwriting.credit.result.averageScore,
          loanType: loan.loanType || 'Conventional',
          termMonths: loan.loanTermMonths || 360,
          propertyOccupancy: occupancyMap[property.occupancy] || 'PrimaryResidence',
          propertyType: propertyTypeMap[property.propertyType] || 'SingleFamily'
        })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Pricing failed')
      }
      const result = await res.json()
      setUnderwriting(prev => ({
        ...prev,
        pricing: { result, pricedAt: new Date().toISOString() }
      }))
    } catch (err: any) {
      alert(err?.message || 'Pricing failed')
    } finally {
      setUwLoading(prev => ({ ...prev, pricing: false }))
    }
  }

  if (loading) {
    return <main className="p-6"><p>Loading...</p></main>
  }

  if (error || !app) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error || 'Application not found'}</p>
        <Link href="/admin" className="text-blue-600 hover:underline">Back to Admin</Link>
      </main>
    )
  }

  const borrower = app.borrowers?.[0] || {}
  const loan = app.data?.loan || {}
  const property = app.data?.property || {}
  const assets = app.data?.assets?.assets || []
  const liabilities = app.data?.liabilities?.liabilities || []
  const declarations = app.data?.declarations?.declarations || {}

  const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
  const totalLiabilities = liabilities.reduce((sum: number, l: any) => sum + (l.balance || 0), 0)
  const monthlyDebt = liabilities.reduce((sum: number, l: any) => sum + (l.monthlyPayment || 0), 0)

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-blue-600 hover:underline text-sm">← Back to Admin</Link>
            <h1 className="text-2xl font-bold mt-2">Application Details</h1>
            <p className="text-sm text-gray-500 font-mono">{app.id}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Management */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className={`input w-auto ${STATUS_OPTIONS.find(s => s.value === app.status)?.color}`}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">Export Application</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExportPdf()}
              disabled={exporting}
              className="btn bg-red-600"
            >
              {exporting ? 'Exporting...' : 'Export URLA PDF'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn bg-blue-600"
            >
              {exporting ? 'Exporting...' : 'Export MISMO JSON'}
            </button>
            <button
              onClick={() => handleExport('xml')}
              disabled={exporting}
              className="btn bg-green-600"
            >
              {exporting ? 'Exporting...' : 'Export MISMO XML'}
            </button>
            <Link href={`/apply/${id}`} className="btn bg-gray-600">
              Edit Application
            </Link>
          </div>
        </div>

        {/* Underwriting Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Underwriting</h2>

          {/* Qualification Summary Banner */}
          {(() => {
            const qual = calculateQualification(underwriting, loan.loanAmount, property.propertyValue)
            const badge = getQualificationBadge(qual.status)
            const creditScore = underwriting.credit?.result.averageScore
            const monthlyIncome = underwriting.income?.result.income.verifiedAnnual
              ? underwriting.income.result.income.verifiedAnnual / 12
              : 0
            const monthlyPayment = underwriting.pricing?.result.monthlyBreakdown.total || 0
            const dti = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0
            const estimatedValue = underwriting.property?.result.valuation.estimatedValue || property.propertyValue || 0
            const ltv = estimatedValue > 0 ? ((loan.loanAmount || 0) / estimatedValue) * 100 : 0

            return (
              <div className="mb-6">
                <div className={`rounded-lg p-4 ${
                  qual.status === 'qualified' ? 'bg-green-50 border border-green-200' :
                  qual.status === 'conditionally_qualified' ? 'bg-yellow-50 border border-yellow-200' :
                  qual.status === 'not_qualified' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.colorClass}`}>
                      {badge.label.toUpperCase()}
                    </span>
                    {creditScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Credit:</span>
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${getCreditRiskBadge(creditScore).colorClass}`}>
                          {creditScore}
                        </span>
                      </div>
                    )}
                    {dti > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">DTI:</span>
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${getDTIRiskBadge(dti).colorClass}`}>
                          {formatPercent(dti)}
                        </span>
                      </div>
                    )}
                    {ltv > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">LTV:</span>
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${getLTVRiskBadge(ltv).colorClass}`}>
                          {formatPercent(ltv)}
                        </span>
                      </div>
                    )}
                    {monthlyPayment > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Payment:</span>
                        <span className="text-sm font-medium">{formatCurrency(monthlyPayment)}/mo</span>
                      </div>
                    )}
                  </div>
                  {qual.reasons.length > 0 && (
                    <div className="mt-3 text-sm">
                      {qual.reasons.map((reason, i) => (
                        <p key={i} className={`${
                          qual.status === 'not_qualified' ? 'text-red-700' :
                          qual.status === 'conditionally_qualified' ? 'text-yellow-700' :
                          'text-gray-600'
                        }`}>
                          {qual.status === 'not_qualified' ? '✗' : qual.status === 'conditionally_qualified' ? '⚠' : '✓'} {reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleCreditPull}
              disabled={uwLoading.credit}
              className="btn bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {uwLoading.credit ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </span>
              ) : underwriting.credit ? 'Re-Pull Credit' : 'Run Credit Pull'}
            </button>
            <button
              onClick={handleIncomeVerify}
              disabled={uwLoading.income}
              className="btn bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              {uwLoading.income ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : underwriting.income ? 'Re-Verify Income' : 'Verify Income'}
            </button>
            <button
              onClick={handlePropertyValue}
              disabled={uwLoading.property}
              className="btn bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              {uwLoading.property ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Valuating...
                </span>
              ) : underwriting.property ? 'Re-Value Property' : 'Get Appraisal'}
            </button>
            <button
              onClick={handlePricing}
              disabled={uwLoading.pricing || !underwriting.credit}
              className="btn bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              title={!underwriting.credit ? 'Run credit pull first' : ''}
            >
              {uwLoading.pricing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Pricing...
                </span>
              ) : underwriting.pricing ? 'Re-Price Loan' : 'Get Pricing'}
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Credit Results */}
            {underwriting.credit && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">Credit Report</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCreditRiskBadge(underwriting.credit.result.averageScore).colorClass}`}>
                    {getCreditRiskBadge(underwriting.credit.result.averageScore).label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Score</span>
                    <span className="font-semibold text-lg">{underwriting.credit.result.averageScore}</span>
                  </div>
                  <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                    {underwriting.credit.result.scores.map((s) => (
                      <p key={s.bureau}>{s.bureau}: {s.score}</p>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Pulled: {formatDateTime(underwriting.credit.pulledAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Income Results */}
            {underwriting.income && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">Income Verification</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getIncomeRiskBadge(underwriting.income.result.employment.status).colorClass}`}>
                    {getIncomeRiskBadge(underwriting.income.result.employment.status).label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified Annual</span>
                    <span className="font-semibold">{formatCurrency(underwriting.income.result.income.verifiedAnnual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employer</span>
                    <span>{underwriting.income.result.employer.name}</span>
                  </div>
                  {underwriting.income.result.income.variancePercent !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variance</span>
                      <span className={underwriting.income.result.income.variancePercent > 0 ? 'text-green-600' : 'text-red-600'}>
                        {underwriting.income.result.income.variancePercent > 0 ? '+' : ''}{underwriting.income.result.income.variancePercent}%
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Verified: {formatDateTime(underwriting.income.verifiedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Property Results */}
            {underwriting.property && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">Property Valuation</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPropertyConfidenceRiskBadge(underwriting.property.result.valuation.confidence).colorClass}`}>
                    {getPropertyConfidenceRiskBadge(underwriting.property.result.valuation.confidence).label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Value</span>
                    <span className="font-semibold text-lg">{formatCurrency(underwriting.property.result.valuation.estimatedValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Range</span>
                    <span>{formatCurrency(underwriting.property.result.valuation.lowRange)} - {formatCurrency(underwriting.property.result.valuation.highRange)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price/SqFt</span>
                    <span>${underwriting.property.result.valuation.pricePerSqFt}/sqft</span>
                  </div>
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Valued: {formatDateTime(underwriting.property.valuedAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Results */}
            {underwriting.pricing && underwriting.pricing.result.scenarios?.[0] && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">Loan Pricing</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {underwriting.pricing.result.scenarios[0].rate?.toFixed(3) || '0.000'}% Rate
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="font-semibold text-lg">{formatCurrency(underwriting.pricing.result.monthlyBreakdown.total)}</span>
                  </div>
                  <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Principal & Interest</span>
                      <span>{formatCurrency(underwriting.pricing.result.monthlyBreakdown.principal + underwriting.pricing.result.monthlyBreakdown.interest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Taxes</span>
                      <span>{formatCurrency(underwriting.pricing.result.monthlyBreakdown.taxes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Insurance</span>
                      <span>{formatCurrency(underwriting.pricing.result.monthlyBreakdown.insurance)}</span>
                    </div>
                    {underwriting.pricing.result.monthlyBreakdown.pmi > 0 && (
                      <div className="flex justify-between">
                        <span>PMI</span>
                        <span>{formatCurrency(underwriting.pricing.result.monthlyBreakdown.pmi)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Priced: {formatDateTime(underwriting.pricing.pricedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Empty State */}
          {!underwriting.credit && !underwriting.income && !underwriting.property && !underwriting.pricing && (
            <div className="text-center py-8 text-gray-500">
              <p>No underwriting checks have been run yet.</p>
              <p className="text-sm mt-1">Click the buttons above to run credit, income, property, and pricing checks.</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-500 mb-1">Loan Amount</h3>
            <div className="text-2xl font-bold">${(loan.loanAmount || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">{loan.loanType || 'Conventional'} - {(loan.loanTermMonths || 360) / 12} years</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-500 mb-1">Property Value</h3>
            <div className="text-2xl font-bold">${(property.propertyValue || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">
              LTV: {property.propertyValue ? ((loan.loanAmount / property.propertyValue) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-500 mb-1">Net Worth</h3>
            <div className={`text-2xl font-bold ${totalAssets - totalLiabilities >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalAssets - totalLiabilities).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly debt: ${monthlyDebt.toLocaleString()}</div>
          </div>
        </div>

        {/* Borrower Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Borrower Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-gray-500">Name</h4>
              <p>{borrower.name?.firstName} {borrower.name?.middleName} {borrower.name?.lastName} {borrower.name?.suffix}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">SSN</h4>
              <p className="font-mono">{borrower.ssn || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Date of Birth</h4>
              <p>{borrower.dob || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Citizenship</h4>
              <p className="capitalize">{borrower.citizenship?.replace(/_/g, ' ') || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Email</h4>
              <p>{borrower.contact?.email || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Phone</h4>
              <p>{borrower.contact?.cellPhone || '-'}</p>
            </div>
            {borrower.currentAddress?.address && (
              <div className="col-span-2">
                <h4 className="text-sm text-gray-500">Current Address</h4>
                <p>
                  {borrower.currentAddress.address.street}
                  {borrower.currentAddress.address.unit && `, ${borrower.currentAddress.address.unit}`}
                  <br />
                  {borrower.currentAddress.address.city}, {borrower.currentAddress.address.state} {borrower.currentAddress.address.zip}
                </p>
                <p className="text-sm text-gray-600">
                  {borrower.currentAddress.housingType === 'own' ? 'Owns' :
                   borrower.currentAddress.housingType === 'rent' ? `Rents ($${borrower.currentAddress.monthlyRent}/mo)` :
                   'Living rent-free'}
                  {' - '}
                  {borrower.currentAddress.durationYears || 0} years, {borrower.currentAddress.durationMonths || 0} months
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Employment */}
        {borrower.employment && borrower.employment.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Employment</h2>
            {borrower.employment.map((emp: any, i: number) => (
              <div key={i} className={`${i > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{emp.employerName}</p>
                    <p className="text-sm text-gray-600">{emp.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(emp.monthlyIncome || 0).toLocaleString()}/mo</p>
                    <p className="text-sm text-gray-600">{emp.current ? 'Current' : 'Previous'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Property */}
        {property.address && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Subject Property</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <h4 className="text-sm text-gray-500">Address</h4>
                <p>
                  {property.address.street}
                  {property.address.unit && `, ${property.address.unit}`}
                  <br />
                  {property.address.city}, {property.address.state} {property.address.zip}
                </p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Property Type</h4>
                <p className="capitalize">{property.propertyType?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Occupancy</h4>
                <p className="capitalize">{property.occupancy?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Units</h4>
                <p>{property.numberOfUnits || 1}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Year Built</h4>
                <p>{property.yearBuilt || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm text-gray-500">Purpose</h4>
              <p className="capitalize">{loan.loanPurpose || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Type</h4>
              <p className="capitalize">{loan.loanType || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Term</h4>
              <p>{(loan.loanTermMonths || 360) / 12} years</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Rate Type</h4>
              <p className="capitalize">{loan.interestRateType || 'Fixed'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Down Payment</h4>
              <p>${(loan.downPayment?.amount || 0).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Down Payment Source</h4>
              <p className="capitalize">{loan.downPayment?.source?.replace(/_/g, ' ') || '-'}</p>
            </div>
          </div>
        </div>

        {/* Assets & Liabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Assets</h2>
            {assets.length === 0 ? (
              <p className="text-gray-500">No assets listed</p>
            ) : (
              <>
                {assets.map((asset: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="capitalize">{asset.type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-500">{asset.institution}</p>
                    </div>
                    <p className="font-medium">${(asset.balance || 0).toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">${totalAssets.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Liabilities</h2>
            {liabilities.length === 0 ? (
              <p className="text-gray-500">No liabilities listed</p>
            ) : (
              <>
                {liabilities.map((liability: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="capitalize">{liability.type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-500">{liability.creditor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(liability.balance || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">${liability.monthlyPayment}/mo</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-semibold">
                  <span>Total</span>
                  <span className="text-red-600">${totalLiabilities.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Declarations Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Declarations Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.entries(declarations).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={value ? 'text-red-600' : 'text-green-600'}>
                  {value ? '⚠' : '✓'}
                </span>
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-sm text-gray-500 text-center">
          <p>Created: {new Date(app.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(app.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </main>
  )
}
