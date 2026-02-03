/**
 * Pre-Qualification Calculator Logic
 * Pure functions for calculating mortgage pre-qualification estimates
 */

// Credit score tiers with corresponding interest rates
export type CreditScoreTier = 'excellent' | 'good' | 'fair' | 'below_fair'

export const CREDIT_TIERS: Record<CreditScoreTier, { label: string; minScore: number; rate: number }> = {
  excellent: { label: 'Excellent (750+)', minScore: 750, rate: 0.065 },
  good: { label: 'Good (700-749)', minScore: 700, rate: 0.06875 },
  fair: { label: 'Fair (650-699)', minScore: 650, rate: 0.0725 },
  below_fair: { label: 'Below 650', minScore: 0, rate: 0.0775 }
}

export type PropertyType = 'single_family' | 'condo' | 'multi_unit'
export type OccupancyType = 'primary' | 'secondary' | 'investment'
export type LoanTerm = 15 | 30

export interface PrequalifyInput {
  annualGrossIncome: number
  monthlyDebtPayments: number
  creditScoreTier: CreditScoreTier
  downPayment: number
  loanTerm: LoanTerm
  propertyType: PropertyType
  occupancy: OccupancyType
}

export interface PrequalifyResult {
  maxLoanAmount: number
  estimatedMonthlyPayment: number
  principalAndInterest: number
  taxesAndInsurance: number
  interestRate: number
  dtiRatio: number
  maxPurchasePrice: number
  qualified: boolean
  warnings: string[]
}

// DTI thresholds
const DTI_MAX = 0.43 // 43% maximum DTI
const DTI_WARNING = 0.36 // 36% warning threshold

// Taxes/insurance estimate: 1.5% annual of home value
const TAX_INSURANCE_RATE = 0.015

/**
 * Calculate monthly payment for a loan (Principal & Interest only)
 * Uses standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPI(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0) return 0
  if (annualRate <= 0) return principal / (termYears * 12)

  const monthlyRate = annualRate / 12
  const numPayments = termYears * 12

  const factor = Math.pow(1 + monthlyRate, numPayments)
  const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1)

  return Math.round(monthlyPayment * 100) / 100
}

/**
 * Calculate monthly taxes and insurance estimate
 * Based on 1.5% annual of home value
 */
export function calculateMonthlyTaxesInsurance(homeValue: number): number {
  if (homeValue <= 0) return 0
  return Math.round((homeValue * TAX_INSURANCE_RATE / 12) * 100) / 100
}

/**
 * Calculate maximum loan amount based on income and DTI constraints
 * Working backwards from max allowable monthly housing payment
 */
export function calculateMaxLoanAmount(
  annualGrossIncome: number,
  monthlyDebtPayments: number,
  annualRate: number,
  termYears: number,
  downPayment: number
): number {
  if (annualGrossIncome <= 0) return 0

  const monthlyIncome = annualGrossIncome / 12
  const maxTotalDebtPayment = monthlyIncome * DTI_MAX
  const maxHousingPayment = maxTotalDebtPayment - monthlyDebtPayments

  if (maxHousingPayment <= 0) return 0

  // We need to find P where: PI + TI <= maxHousingPayment
  // This requires iteration since TI depends on home value (P + downPayment)

  // Initial estimate: use max housing payment as P&I
  let estimatedLoan = estimateLoanFromPayment(maxHousingPayment, annualRate, termYears)

  // Iterate to account for taxes/insurance
  for (let i = 0; i < 10; i++) {
    const homeValue = estimatedLoan + downPayment
    const ti = calculateMonthlyTaxesInsurance(homeValue)
    const availableForPI = maxHousingPayment - ti

    if (availableForPI <= 0) {
      estimatedLoan = 0
      break
    }

    const newEstimate = estimateLoanFromPayment(availableForPI, annualRate, termYears)

    // Converged
    if (Math.abs(newEstimate - estimatedLoan) < 100) {
      estimatedLoan = newEstimate
      break
    }

    estimatedLoan = newEstimate
  }

  // Round down to nearest $1000
  return Math.floor(estimatedLoan / 1000) * 1000
}

/**
 * Estimate loan amount from desired monthly payment
 * Inverse of the amortization formula
 */
export function estimateLoanFromPayment(
  monthlyPayment: number,
  annualRate: number,
  termYears: number
): number {
  if (monthlyPayment <= 0) return 0
  if (annualRate <= 0) return monthlyPayment * termYears * 12

  const monthlyRate = annualRate / 12
  const numPayments = termYears * 12

  const factor = Math.pow(1 + monthlyRate, numPayments)
  const principal = monthlyPayment * (factor - 1) / (monthlyRate * factor)

  return principal
}

/**
 * Calculate DTI ratio
 * Total monthly debt (including proposed housing payment) / gross monthly income
 */
export function calculateDTI(
  monthlyHousingPayment: number,
  monthlyDebtPayments: number,
  annualGrossIncome: number
): number {
  if (annualGrossIncome <= 0) return 1 // 100% DTI if no income

  const monthlyIncome = annualGrossIncome / 12
  const totalDebt = monthlyHousingPayment + monthlyDebtPayments

  return Math.round((totalDebt / monthlyIncome) * 1000) / 1000 // Round to 3 decimal places
}

/**
 * Main pre-qualification calculation
 */
export function calculatePrequalification(input: PrequalifyInput): PrequalifyResult {
  const warnings: string[] = []

  // Get interest rate for credit tier
  const interestRate = CREDIT_TIERS[input.creditScoreTier].rate

  // Calculate max loan amount
  const maxLoanAmount = calculateMaxLoanAmount(
    input.annualGrossIncome,
    input.monthlyDebtPayments,
    interestRate,
    input.loanTerm,
    input.downPayment
  )

  // Calculate max purchase price
  const maxPurchasePrice = maxLoanAmount + input.downPayment

  // Calculate monthly payments
  const principalAndInterest = calculateMonthlyPI(maxLoanAmount, interestRate, input.loanTerm)
  const taxesAndInsurance = calculateMonthlyTaxesInsurance(maxPurchasePrice)
  const estimatedMonthlyPayment = principalAndInterest + taxesAndInsurance

  // Calculate DTI ratio
  const dtiRatio = calculateDTI(
    estimatedMonthlyPayment,
    input.monthlyDebtPayments,
    input.annualGrossIncome
  )

  // Check qualification status
  let qualified = maxLoanAmount > 0 && dtiRatio <= DTI_MAX

  // Add warnings
  if (dtiRatio > DTI_WARNING && dtiRatio <= DTI_MAX) {
    warnings.push('Your DTI ratio is above 36%. Some lenders may require additional documentation.')
  }

  if (dtiRatio > DTI_MAX) {
    qualified = false
    warnings.push('Your DTI ratio exceeds 43%. Consider reducing debt or increasing income.')
  }

  if (input.creditScoreTier === 'below_fair') {
    warnings.push('Credit scores below 650 may limit loan options and result in higher rates.')
  }

  if (input.occupancy === 'investment') {
    warnings.push('Investment properties typically require larger down payments and may have higher rates.')
  }

  if (input.propertyType === 'multi_unit') {
    warnings.push('Multi-unit properties may have different qualification requirements.')
  }

  if (maxLoanAmount <= 0) {
    qualified = false
    warnings.push('Based on the provided information, you may not qualify for a mortgage at this time.')
  }

  return {
    maxLoanAmount,
    estimatedMonthlyPayment: Math.round(estimatedMonthlyPayment * 100) / 100,
    principalAndInterest,
    taxesAndInsurance,
    interestRate,
    dtiRatio,
    maxPurchasePrice,
    qualified,
    warnings
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercent(decimal: number): string {
  return (decimal * 100).toFixed(2) + '%'
}

/**
 * Format DTI for display
 */
export function formatDTI(decimal: number): string {
  return (decimal * 100).toFixed(1) + '%'
}

/**
 * Get qualification status color/type
 */
export function getQualificationStatus(result: PrequalifyResult): 'qualified' | 'warning' | 'not_qualified' {
  if (!result.qualified) return 'not_qualified'
  if (result.dtiRatio > DTI_WARNING) return 'warning'
  return 'qualified'
}
