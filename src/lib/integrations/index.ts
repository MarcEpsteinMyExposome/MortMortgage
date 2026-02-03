/**
 * Mock Integrations Module
 *
 * This module provides stubbed integrations for demo purposes.
 * All integrations return deterministic results based on input patterns.
 */

// Credit Bureau Integration
export {
  simulateCreditPull,
  getScoreDescription,
  getCreditRateAdjustment,
  type CreditReport,
  type CreditScore,
  type CreditTradeline,
  type CreditPullRequest
} from './credit'

// Income Verification Integration
export {
  verifyIncome,
  calculateDTI,
  getIncomeStabilityScore,
  type IncomeVerification,
  type IncomeVerificationRequest,
  type EmploymentStatus
} from './income'

// Automated Valuation Model (AVM) Integration
export {
  getPropertyValuation,
  calculateLTV,
  validatePropertyValue,
  type AVMResult,
  type AVMRequest,
  type AVMConfidence,
  type ComparableSale
} from './avm'

// Pricing Engine Integration
export {
  calculatePricing,
  getRateQuoteSummary,
  compareScenarios,
  type PricingResult,
  type PricingRequest,
  type PricingScenario,
  type LoanType,
  type LoanPurpose,
  type PropertyOccupancy
} from './pricing'

/**
 * Demo Scenarios
 *
 * SSN patterns for testing different outcomes:
 *
 * Credit Pull:
 * - SSN ending in 0-2: Poor credit (500-649)
 * - SSN ending in 3-4: Fair credit (650-699)
 * - SSN ending in 5-6: Good credit (700-749)
 * - SSN ending in 7-9: Excellent credit (750-850)
 *
 * Income Verification:
 * - Even SSN: Clean verification
 * - Odd SSN ending in 1,3: Minor discrepancy
 * - Odd SSN ending in 5,7,9: Unable to verify
 *
 * AVM:
 * - State affects base price (CA, NY, WA = high; TX, OH = lower)
 * - Property type affects valuation
 * - More details = higher confidence
 *
 * Pricing:
 * - Credit score has major impact
 * - LTV affects rate and PMI
 * - Property type and occupancy add adjustments
 */

// Demo SSN patterns for testing
export const DEMO_SSNS = {
  EXCELLENT_CREDIT: '123-45-6789', // Ends in 9 = excellent
  GOOD_CREDIT: '123-45-6785',     // Ends in 5 = good
  FAIR_CREDIT: '123-45-6783',     // Ends in 3 = fair
  POOR_CREDIT: '123-45-6781',     // Ends in 1 = poor
  VERIFIED_INCOME: '123-45-6780', // Even = verified
  INCOME_DISCREPANCY: '123-45-6783', // Odd, ends in 3 = discrepancy
  UNVERIFIED_INCOME: '123-45-6785', // Odd, ends in 5 = unverified
}
