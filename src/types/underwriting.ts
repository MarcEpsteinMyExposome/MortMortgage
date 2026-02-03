/**
 * Underwriting Types
 *
 * Types for storing underwriting results in application.data.underwriting
 */

import type { CreditReport } from '../lib/integrations/credit'
import type { IncomeVerification } from '../lib/integrations/income'
import type { AVMResult } from '../lib/integrations/avm'
import type { PricingResult } from '../lib/integrations/pricing'

/**
 * Stored credit pull result with metadata
 */
export type CreditPullResult = {
  result: CreditReport
  pulledAt: string
  pulledBy?: string
}

/**
 * Stored income verification result with metadata
 */
export type IncomeVerifyResult = {
  result: IncomeVerification
  verifiedAt: string
  verifiedBy?: string
}

/**
 * Stored property valuation result with metadata
 */
export type PropertyValueResult = {
  result: AVMResult
  valuedAt: string
  valuedBy?: string
}

/**
 * Stored pricing result with metadata
 */
export type PricingCalcResult = {
  result: PricingResult
  pricedAt: string
  pricedBy?: string
}

/**
 * Qualification status based on all underwriting results
 */
export type QualificationStatus =
  | 'qualified'           // All checks pass
  | 'conditionally_qualified'  // Minor issues, may need explanation
  | 'not_qualified'       // Blocking issues
  | 'pending'             // Not all checks run yet

/**
 * Qualification assessment with reasons
 */
export type QualificationResult = {
  status: QualificationStatus
  calculatedAt: string
  reasons: string[]
}

/**
 * All underwriting data stored on an application
 */
export type UnderwritingData = {
  credit?: CreditPullResult
  income?: IncomeVerifyResult
  property?: PropertyValueResult
  pricing?: PricingCalcResult
  qualification?: QualificationResult
}

/**
 * Risk level for badges
 */
export type RiskLevel = 'low' | 'medium' | 'high'

/**
 * Risk badge display info
 */
export type RiskBadge = {
  level: RiskLevel
  label: string
  colorClass: string  // Tailwind classes for styling
}
