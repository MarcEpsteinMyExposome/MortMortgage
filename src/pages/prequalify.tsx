import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  calculatePrequalification,
  formatCurrency,
  formatPercent,
  formatDTI,
  getQualificationStatus,
  CREDIT_TIERS,
  type PrequalifyInput,
  type PrequalifyResult,
  type CreditScoreTier,
  type PropertyType,
  type OccupancyType,
  type LoanTerm
} from '../lib/prequalify'

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family Home' },
  { value: 'condo', label: 'Condominium' },
  { value: 'multi_unit', label: 'Multi-unit (2-4 units)' }
]

const OCCUPANCY_TYPES = [
  { value: 'primary', label: 'Primary Residence' },
  { value: 'secondary', label: 'Secondary/Vacation Home' },
  { value: 'investment', label: 'Investment Property' }
]

const LOAN_TERMS = [
  { value: 30, label: '30 Years' },
  { value: 15, label: '15 Years' }
]

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default function PrequalifyPage() {
  const router = useRouter()

  // Form state
  const [annualIncome, setAnnualIncome] = useState('')
  const [monthlyDebt, setMonthlyDebt] = useState('')
  const [creditTier, setCreditTier] = useState<CreditScoreTier>('good')
  const [downPayment, setDownPayment] = useState('')
  const [loanTerm, setLoanTerm] = useState<LoanTerm>(30)
  const [propertyType, setPropertyType] = useState<PropertyType>('single_family')
  const [occupancy, setOccupancy] = useState<OccupancyType>('primary')

  // Results state
  const [result, setResult] = useState<PrequalifyResult | null>(null)

  // Create input object for debouncing
  const inputData: PrequalifyInput = {
    annualGrossIncome: parseFloat(annualIncome) || 0,
    monthlyDebtPayments: parseFloat(monthlyDebt) || 0,
    creditScoreTier: creditTier,
    downPayment: parseFloat(downPayment) || 0,
    loanTerm,
    propertyType,
    occupancy
  }

  // Debounce calculations by 300ms
  const debouncedInput = useDebounce(inputData, 300)

  // Calculate results when debounced input changes
  useEffect(() => {
    if (debouncedInput.annualGrossIncome > 0) {
      const calcResult = calculatePrequalification(debouncedInput)
      setResult(calcResult)
    } else {
      setResult(null)
    }
  }, [
    debouncedInput.annualGrossIncome,
    debouncedInput.monthlyDebtPayments,
    debouncedInput.creditScoreTier,
    debouncedInput.downPayment,
    debouncedInput.loanTerm,
    debouncedInput.propertyType,
    debouncedInput.occupancy
  ])

  // Save data to sessionStorage and navigate to full application
  const handleStartApplication = useCallback(() => {
    const prequalData = {
      annualGrossIncome: parseFloat(annualIncome) || 0,
      monthlyDebtPayments: parseFloat(monthlyDebt) || 0,
      creditScoreTier: creditTier,
      downPayment: parseFloat(downPayment) || 0,
      loanTerm,
      propertyType,
      occupancy,
      maxLoanAmount: result?.maxLoanAmount || 0,
      maxPurchasePrice: result?.maxPurchasePrice || 0
    }
    sessionStorage.setItem('prequalData', JSON.stringify(prequalData))
    router.push('/auth/signin?callbackUrl=/apply/new')
  }, [annualIncome, monthlyDebt, creditTier, downPayment, loanTerm, propertyType, occupancy, result, router])

  // Get status for styling
  const status = result ? getQualificationStatus(result) : null

  const statusColors = {
    qualified: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    not_qualified: 'bg-danger-50 border-danger-200 text-danger-800'
  }

  const statusBadgeColors = {
    qualified: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    not_qualified: 'bg-danger-100 text-danger-700'
  }

  const statusLabels = {
    qualified: 'Pre-Qualified',
    warning: 'Pre-Qualified with Caution',
    not_qualified: 'Not Qualified'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">MortMortgage</span>
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Pre-Qualification Calculator
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Get an instant estimate of how much home you can afford. No credit check required.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="card p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Financial Information</h2>

              <div className="space-y-5">
                {/* Annual Income */}
                <div>
                  <label htmlFor="annualIncome" className="label">
                    Annual Gross Income <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="annualIncome"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      className="input pl-7"
                      placeholder="85000"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your total income before taxes</p>
                </div>

                {/* Monthly Debt */}
                <div>
                  <label htmlFor="monthlyDebt" className="label">
                    Monthly Debt Payments
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="monthlyDebt"
                      value={monthlyDebt}
                      onChange={(e) => setMonthlyDebt(e.target.value)}
                      className="input pl-7"
                      placeholder="500"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Car loans, student loans, credit cards, etc.</p>
                </div>

                {/* Credit Score */}
                <div>
                  <label htmlFor="creditTier" className="label">
                    Credit Score Range
                  </label>
                  <select
                    id="creditTier"
                    value={creditTier}
                    onChange={(e) => setCreditTier(e.target.value as CreditScoreTier)}
                    className="input"
                  >
                    {Object.entries(CREDIT_TIERS).map(([key, tier]) => (
                      <option key={key} value={key}>{tier.label}</option>
                    ))}
                  </select>
                </div>

                {/* Down Payment */}
                <div>
                  <label htmlFor="downPayment" className="label">
                    Down Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="downPayment"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="input pl-7"
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">How much you plan to put down</p>
                </div>

                {/* Loan Term */}
                <div>
                  <label htmlFor="loanTerm" className="label">
                    Loan Term
                  </label>
                  <select
                    id="loanTerm"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value) as LoanTerm)}
                    className="input"
                  >
                    {LOAN_TERMS.map((term) => (
                      <option key={term.value} value={term.value}>{term.label}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label htmlFor="propertyType" className="label">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="input"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Occupancy */}
                <div>
                  <label htmlFor="occupancy" className="label">
                    Occupancy Type
                  </label>
                  <select
                    id="occupancy"
                    value={occupancy}
                    onChange={(e) => setOccupancy(e.target.value as OccupancyType)}
                    className="input"
                  >
                    {OCCUPANCY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Results Card */}
              <div className={`card p-6 lg:p-8 border-2 ${result && status ? statusColors[status] : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Estimate</h2>
                  {result && status && (
                    <span className={`badge ${statusBadgeColors[status]}`}>
                      {statusLabels[status]}
                    </span>
                  )}
                </div>

                {result ? (
                  <div className="space-y-6">
                    {/* Main Results */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Max Purchase Price</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(result.maxPurchasePrice)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Max Loan Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(result.maxLoanAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-500 mb-3">Estimated Monthly Payment</p>
                      <p className="text-3xl font-bold text-primary-600 mb-4">
                        {formatCurrency(result.estimatedMonthlyPayment)}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Principal & Interest</span>
                          <span className="font-medium">{formatCurrency(result.principalAndInterest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Taxes & Insurance</span>
                          <span className="font-medium">{formatCurrency(result.taxesAndInsurance)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-gray-500">Interest Rate</p>
                        <p className="font-semibold text-gray-900">{formatPercent(result.interestRate)}</p>
                      </div>
                      <div className={`rounded-lg p-3 shadow-sm ${result.dtiRatio > 0.36 ? 'bg-warning-50' : 'bg-white'}`}>
                        <p className="text-gray-500">DTI Ratio</p>
                        <p className={`font-semibold ${result.dtiRatio > 0.43 ? 'text-danger-600' : result.dtiRatio > 0.36 ? 'text-warning-600' : 'text-gray-900'}`}>
                          {formatDTI(result.dtiRatio)}
                        </p>
                      </div>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <div className="space-y-2">
                        {result.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-warning-700 bg-warning-50 rounded-lg p-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={handleStartApplication}
                      className="btn btn-primary btn-lg w-full"
                    >
                      Start Full Application
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">Enter your annual income to see your estimate</p>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-4">
                <p className="font-medium text-gray-700 mb-1">Important Disclaimer</p>
                <p>
                  This pre-qualification estimate is for informational purposes only and does not constitute
                  a loan commitment or guarantee. Actual loan terms, rates, and eligibility will be determined
                  during the formal application process. Rates shown are estimates based on credit tier and
                  may vary. Taxes and insurance are estimated at 1.5% annually of home value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>Demo application. All data is for presentation purposes only.</p>
        </div>
      </footer>
    </main>
  )
}
