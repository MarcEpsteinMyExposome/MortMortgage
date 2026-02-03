/**
 * Underwriting Utilities
 *
 * Helper functions for calculating risk badges and qualification status
 */

import type {
  RiskBadge,
  RiskLevel,
  QualificationResult,
  UnderwritingData
} from '../types/underwriting'
import type { EmploymentStatus } from './integrations/income'
import type { AVMConfidence } from './integrations/avm'

// ============================================================================
// Risk Badge Calculations
// ============================================================================

/**
 * Get risk badge for credit score
 */
export function getCreditRiskBadge(score: number): RiskBadge {
  if (score >= 740) {
    return { level: 'low', label: 'Excellent', colorClass: 'bg-green-100 text-green-800' }
  }
  if (score >= 680) {
    return { level: 'medium', label: 'Good', colorClass: 'bg-yellow-100 text-yellow-800' }
  }
  return { level: 'high', label: 'Below Standard', colorClass: 'bg-red-100 text-red-800' }
}

/**
 * Get risk badge for DTI ratio (back-end)
 */
export function getDTIRiskBadge(backEndDTI: number): RiskBadge {
  if (backEndDTI <= 36) {
    return { level: 'low', label: 'Low DTI', colorClass: 'bg-green-100 text-green-800' }
  }
  if (backEndDTI <= 43) {
    return { level: 'medium', label: 'Acceptable', colorClass: 'bg-yellow-100 text-yellow-800' }
  }
  return { level: 'high', label: 'High DTI', colorClass: 'bg-red-100 text-red-800' }
}

/**
 * Get risk badge for LTV ratio
 */
export function getLTVRiskBadge(ltv: number): RiskBadge {
  if (ltv <= 80) {
    return { level: 'low', label: 'No PMI', colorClass: 'bg-green-100 text-green-800' }
  }
  if (ltv <= 95) {
    return { level: 'medium', label: 'PMI Required', colorClass: 'bg-yellow-100 text-yellow-800' }
  }
  return { level: 'high', label: 'High LTV', colorClass: 'bg-red-100 text-red-800' }
}

/**
 * Get risk badge for income verification status
 */
export function getIncomeRiskBadge(status: EmploymentStatus): RiskBadge {
  if (status === 'Verified') {
    return { level: 'low', label: 'Verified', colorClass: 'bg-green-100 text-green-800' }
  }
  if (status === 'Discrepancy Found') {
    return { level: 'medium', label: 'Discrepancy', colorClass: 'bg-yellow-100 text-yellow-800' }
  }
  return { level: 'high', label: 'Unverified', colorClass: 'bg-red-100 text-red-800' }
}

/**
 * Get risk badge for property valuation confidence
 */
export function getPropertyConfidenceRiskBadge(confidence: AVMConfidence): RiskBadge {
  if (confidence === 'High') {
    return { level: 'low', label: 'High Confidence', colorClass: 'bg-green-100 text-green-800' }
  }
  if (confidence === 'Medium') {
    return { level: 'medium', label: 'Medium Confidence', colorClass: 'bg-yellow-100 text-yellow-800' }
  }
  return { level: 'high', label: 'Low Confidence', colorClass: 'bg-red-100 text-red-800' }
}

// ============================================================================
// Qualification Status Calculation
// ============================================================================

/**
 * Calculate overall qualification status based on underwriting results
 */
export function calculateQualification(
  underwriting: UnderwritingData,
  loanAmount?: number,
  propertyValue?: number
): QualificationResult {
  const reasons: string[] = []
  let hasBlockers = false
  let hasWarnings = false

  // Check if any checks have been run
  const hasAnyResults = !!(
    underwriting.credit ||
    underwriting.income ||
    underwriting.property ||
    underwriting.pricing
  )

  if (!hasAnyResults) {
    return {
      status: 'pending',
      calculatedAt: new Date().toISOString(),
      reasons: ['Run underwriting checks to determine qualification']
    }
  }

  // Check credit score
  if (underwriting.credit) {
    const score = underwriting.credit.result.averageScore
    if (score < 620) {
      hasBlockers = true
      reasons.push(`Credit score (${score}) below minimum requirement (620)`)
    } else if (score < 680) {
      hasWarnings = true
      reasons.push(`Credit score (${score}) may limit loan options`)
    }
  }

  // Check income verification
  if (underwriting.income) {
    const status = underwriting.income.result.employment.status
    if (status === 'Unable to Verify') {
      hasBlockers = true
      reasons.push('Income could not be verified')
    } else if (status === 'Discrepancy Found') {
      hasWarnings = true
      const variancePercent = underwriting.income.result.income.variancePercent
      reasons.push(`Income discrepancy detected (${variancePercent > 0 ? '+' : ''}${variancePercent}%)`)
    }
  }

  // Check DTI ratio (if we have income and pricing)
  if (underwriting.income && underwriting.pricing) {
    const monthlyIncome = underwriting.income.result.income.verifiedAnnual / 12
    if (monthlyIncome > 0) {
      const monthlyPayment = underwriting.pricing.result.monthlyBreakdown.total
      const backEndDTI = (monthlyPayment / monthlyIncome) * 100
      if (backEndDTI > 50) {
        hasBlockers = true
        reasons.push(`DTI ratio (${backEndDTI.toFixed(1)}%) exceeds maximum (50%)`)
      } else if (backEndDTI > 43) {
        hasWarnings = true
        reasons.push(`DTI ratio (${backEndDTI.toFixed(1)}%) is elevated`)
      }
    }
  }

  // Check LTV ratio
  if (underwriting.property && loanAmount) {
    const estimatedValue = underwriting.property.result.valuation.estimatedValue
    const ltv = (loanAmount / estimatedValue) * 100
    if (ltv > 97) {
      hasBlockers = true
      reasons.push(`LTV (${ltv.toFixed(1)}%) exceeds maximum (97%)`)
    } else if (ltv > 95) {
      hasWarnings = true
      reasons.push(`High LTV (${ltv.toFixed(1)}%) may limit options`)
    } else if (ltv > 80) {
      reasons.push(`LTV (${ltv.toFixed(1)}%) requires PMI`)
    }
  }

  // Check property valuation confidence
  if (underwriting.property) {
    const confidence = underwriting.property.result.valuation.confidence
    if (confidence === 'Low') {
      hasWarnings = true
      reasons.push('Property valuation has low confidence - appraisal recommended')
    }
  }

  // Determine final status
  let status: QualificationResult['status']
  if (hasBlockers) {
    status = 'not_qualified'
  } else if (hasWarnings) {
    status = 'conditionally_qualified'
  } else {
    status = 'qualified'
    if (reasons.length === 0) {
      reasons.push('All underwriting checks passed')
    }
  }

  return {
    status,
    calculatedAt: new Date().toISOString(),
    reasons
  }
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format date for display
 */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Get qualification status badge styling
 */
export function getQualificationBadge(status: QualificationResult['status']): {
  label: string
  colorClass: string
} {
  switch (status) {
    case 'qualified':
      return { label: 'Qualified', colorClass: 'bg-green-100 text-green-800' }
    case 'conditionally_qualified':
      return { label: 'Conditional', colorClass: 'bg-yellow-100 text-yellow-800' }
    case 'not_qualified':
      return { label: 'Not Qualified', colorClass: 'bg-red-100 text-red-800' }
    case 'pending':
    default:
      return { label: 'Pending', colorClass: 'bg-gray-100 text-gray-800' }
  }
}
