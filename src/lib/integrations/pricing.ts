/**
 * Mock Pricing Engine Integration
 *
 * Calculates mortgage rates based on loan characteristics.
 * Returns deterministic pricing scenarios for demo purposes.
 */

export type LoanType = 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Jumbo'
export type LoanPurpose = 'Purchase' | 'Refinance' | 'CashOut'
export type PropertyOccupancy = 'PrimaryResidence' | 'SecondHome' | 'Investment'
export type PropertyType = 'SingleFamily' | 'Condo' | 'Townhouse' | 'MultiFamily' | 'Manufactured'

export type PricingScenario = {
  rate: number
  apr: number
  points: number
  pointsCost: number
  monthlyPayment: number
  totalInterest: number
  totalCost: number
  label: string
}

export type PricingResult = {
  success: boolean
  referenceNumber: string
  pricingDate: string
  lockPeriod: number // days
  scenarios: PricingScenario[]
  selectedScenario?: PricingScenario
  loanDetails: {
    loanAmount: number
    loanType: LoanType
    loanPurpose: LoanPurpose
    termMonths: number
    ltv: number
    creditScore: number
  }
  fees: {
    originationFee: number
    appraisalFee: number
    titleInsurance: number
    escrowFees: number
    recordingFees: number
    otherFees: number
    totalClosingCosts: number
  }
  adjustments: {
    description: string
    impact: number // basis points
  }[]
  monthlyBreakdown: {
    principal: number
    interest: number
    taxes: number
    insurance: number
    pmi: number
    total: number
  }
  notes: string[]
}

export type PricingRequest = {
  loanAmount: number
  propertyValue: number
  creditScore: number
  loanType: LoanType
  loanPurpose: LoanPurpose
  termMonths: number // 360 = 30yr, 180 = 15yr
  propertyOccupancy: PropertyOccupancy
  propertyType: PropertyType
  state: string
  isFirstTimeBuyer?: boolean
}

/**
 * Base rates by loan type (as of demo date)
 */
const BASE_RATES: Record<LoanType, number> = {
  Conventional: 6.75,
  FHA: 6.50,
  VA: 6.25,
  USDA: 6.50,
  Jumbo: 7.00
}

/**
 * Term adjustment (15-year gets better rate)
 */
function getTermAdjustment(termMonths: number): number {
  if (termMonths <= 180) return -50 // -0.50%
  if (termMonths <= 240) return -25 // -0.25%
  return 0
}

/**
 * Credit score adjustment in basis points
 */
function getCreditAdjustment(score: number): number {
  if (score >= 780) return -25
  if (score >= 760) return 0
  if (score >= 740) return 25
  if (score >= 720) return 50
  if (score >= 700) return 75
  if (score >= 680) return 125
  if (score >= 660) return 175
  if (score >= 640) return 250
  return 350
}

/**
 * LTV adjustment in basis points
 */
function getLTVAdjustment(ltv: number): number {
  if (ltv <= 60) return -25
  if (ltv <= 70) return -12
  if (ltv <= 75) return 0
  if (ltv <= 80) return 12
  if (ltv <= 85) return 25
  if (ltv <= 90) return 50
  if (ltv <= 95) return 75
  return 100
}

/**
 * Property type adjustment
 */
function getPropertyTypeAdjustment(type: PropertyType): number {
  switch (type) {
    case 'SingleFamily': return 0
    case 'Townhouse': return 12
    case 'Condo': return 25
    case 'MultiFamily': return 50
    case 'Manufactured': return 75
    default: return 0
  }
}

/**
 * Occupancy adjustment
 */
function getOccupancyAdjustment(occupancy: PropertyOccupancy): number {
  switch (occupancy) {
    case 'PrimaryResidence': return 0
    case 'SecondHome': return 37
    case 'Investment': return 75
    default: return 0
  }
}

/**
 * Purpose adjustment
 */
function getPurposeAdjustment(purpose: LoanPurpose): number {
  switch (purpose) {
    case 'Purchase': return 0
    case 'Refinance': return 12
    case 'CashOut': return 37
    default: return 0
  }
}

/**
 * Calculate monthly payment
 */
function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return principal / termMonths

  const payment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)

  return Math.round(payment * 100) / 100
}

/**
 * Calculate total interest over loan term
 */
function calculateTotalInterest(principal: number, monthlyPayment: number, termMonths: number): number {
  return Math.round((monthlyPayment * termMonths - principal) * 100) / 100
}

/**
 * Calculate PMI based on LTV
 */
function calculatePMI(loanAmount: number, ltv: number, creditScore: number): number {
  if (ltv <= 80) return 0

  // PMI rate based on LTV and credit
  let pmiRate = 0.005 // 0.5% annual
  if (ltv > 90) pmiRate = 0.008
  if (ltv > 95) pmiRate = 0.01
  if (creditScore < 700) pmiRate += 0.002

  return Math.round((loanAmount * pmiRate / 12) * 100) / 100
}

/**
 * Generate pricing scenarios (no points, 1 point, 2 points)
 */
function generateScenarios(baseRate: number, loanAmount: number, termMonths: number): PricingScenario[] {
  const scenarios: PricingScenario[] = []

  // Point buydown options: 0, 1, 2 points
  const pointOptions = [
    { points: 0, rateReduction: 0, label: 'No Points (Par Rate)' },
    { points: 1, rateReduction: 25, label: '1 Point (-0.25%)' },
    { points: 2, rateReduction: 50, label: '2 Points (-0.50%)' }
  ]

  for (const option of pointOptions) {
    const rate = Math.round((baseRate - option.rateReduction / 100) * 1000) / 1000
    const pointsCost = Math.round(loanAmount * option.points / 100)
    const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, termMonths)
    const totalInterest = calculateTotalInterest(loanAmount, monthlyPayment, termMonths)

    // APR includes points cost amortized over loan
    const effectiveRate = rate + (pointsCost / loanAmount) * (12 / (termMonths / 12))
    const apr = Math.round(effectiveRate * 1000) / 1000

    scenarios.push({
      rate,
      apr,
      points: option.points,
      pointsCost,
      monthlyPayment,
      totalInterest,
      totalCost: totalInterest + pointsCost,
      label: option.label
    })
  }

  return scenarios
}

/**
 * Calculate closing costs estimate
 */
function calculateClosingCosts(loanAmount: number, propertyValue: number): PricingResult['fees'] {
  const originationFee = Math.round(loanAmount * 0.01) // 1%
  const appraisalFee = 550
  const titleInsurance = Math.round(propertyValue * 0.005) // 0.5%
  const escrowFees = 1500
  const recordingFees = 150
  const otherFees = 800 // Credit report, flood cert, etc.

  return {
    originationFee,
    appraisalFee,
    titleInsurance,
    escrowFees,
    recordingFees,
    otherFees,
    totalClosingCosts: originationFee + appraisalFee + titleInsurance + escrowFees + recordingFees + otherFees
  }
}

/**
 * Calculate mortgage pricing
 */
export function calculatePricing(request: PricingRequest): PricingResult {
  const ltv = Math.round((request.loanAmount / request.propertyValue) * 1000) / 10

  // Calculate adjustments
  const adjustments: PricingResult['adjustments'] = []
  let totalAdjustment = 0

  const termAdj = getTermAdjustment(request.termMonths)
  if (termAdj !== 0) {
    adjustments.push({ description: `${request.termMonths / 12}-year term`, impact: termAdj })
    totalAdjustment += termAdj
  }

  const creditAdj = getCreditAdjustment(request.creditScore)
  if (creditAdj !== 0) {
    adjustments.push({ description: `Credit score ${request.creditScore}`, impact: creditAdj })
    totalAdjustment += creditAdj
  }

  const ltvAdj = getLTVAdjustment(ltv)
  if (ltvAdj !== 0) {
    adjustments.push({ description: `LTV ${ltv}%`, impact: ltvAdj })
    totalAdjustment += ltvAdj
  }

  const propAdj = getPropertyTypeAdjustment(request.propertyType)
  if (propAdj !== 0) {
    adjustments.push({ description: `Property type: ${request.propertyType}`, impact: propAdj })
    totalAdjustment += propAdj
  }

  const occAdj = getOccupancyAdjustment(request.propertyOccupancy)
  if (occAdj !== 0) {
    adjustments.push({ description: `Occupancy: ${request.propertyOccupancy}`, impact: occAdj })
    totalAdjustment += occAdj
  }

  const purpAdj = getPurposeAdjustment(request.loanPurpose)
  if (purpAdj !== 0) {
    adjustments.push({ description: `Purpose: ${request.loanPurpose}`, impact: purpAdj })
    totalAdjustment += purpAdj
  }

  // Calculate final rate
  const baseRate = BASE_RATES[request.loanType]
  const adjustedRate = baseRate + totalAdjustment / 100

  // Generate scenarios
  const scenarios = generateScenarios(adjustedRate, request.loanAmount, request.termMonths)

  // Calculate fees
  const fees = calculateClosingCosts(request.loanAmount, request.propertyValue)

  // Calculate monthly breakdown (using par rate scenario)
  const parScenario = scenarios[0]
  const pmi = calculatePMI(request.loanAmount, ltv, request.creditScore)
  const monthlyTaxes = Math.round(request.propertyValue * 0.012 / 12) // ~1.2% annual
  const monthlyInsurance = Math.round(request.propertyValue * 0.005 / 12) // ~0.5% annual

  const monthlyBreakdown = {
    principal: Math.round((parScenario.monthlyPayment - (request.loanAmount * parScenario.rate / 100 / 12)) * 100) / 100,
    interest: Math.round((request.loanAmount * parScenario.rate / 100 / 12) * 100) / 100,
    taxes: monthlyTaxes,
    insurance: monthlyInsurance,
    pmi,
    total: Math.round((parScenario.monthlyPayment + monthlyTaxes + monthlyInsurance + pmi) * 100) / 100
  }

  // Generate notes
  const notes: string[] = []
  notes.push(`Base rate for ${request.loanType}: ${baseRate}%`)
  notes.push(`Total rate adjustment: ${totalAdjustment >= 0 ? '+' : ''}${totalAdjustment} basis points`)

  if (ltv > 80) {
    notes.push(`PMI required due to LTV > 80% ($${pmi}/month)`)
  }

  if (request.creditScore < 680) {
    notes.push('Credit improvement could significantly lower rate')
  }

  if (request.isFirstTimeBuyer) {
    notes.push('First-time buyer programs may be available')
  }

  return {
    success: true,
    referenceNumber: `PR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    pricingDate: new Date().toISOString(),
    lockPeriod: 30,
    scenarios,
    selectedScenario: scenarios[0], // Default to par rate
    loanDetails: {
      loanAmount: request.loanAmount,
      loanType: request.loanType,
      loanPurpose: request.loanPurpose,
      termMonths: request.termMonths,
      ltv,
      creditScore: request.creditScore
    },
    fees,
    adjustments,
    monthlyBreakdown,
    notes
  }
}

/**
 * Get a rate quote summary string
 */
export function getRateQuoteSummary(result: PricingResult): string {
  const scenario = result.selectedScenario || result.scenarios[0]
  return `${scenario.rate}% rate (${scenario.apr}% APR) - $${scenario.monthlyPayment.toLocaleString()}/month P&I`
}

/**
 * Compare two pricing scenarios
 */
export function compareScenarios(
  scenario1: PricingScenario,
  scenario2: PricingScenario,
  holdYears: number
): { winner: 1 | 2; savings: number; breakEvenMonths: number } {
  // Calculate total cost over hold period
  const months = holdYears * 12
  const cost1 = scenario1.pointsCost + (scenario1.monthlyPayment * months)
  const cost2 = scenario2.pointsCost + (scenario2.monthlyPayment * months)

  const winner = cost1 <= cost2 ? 1 : 2
  const savings = Math.abs(cost1 - cost2)

  // Break-even is when points savings equals payment savings
  const monthlyDiff = scenario1.monthlyPayment - scenario2.monthlyPayment
  const pointsDiff = scenario2.pointsCost - scenario1.pointsCost
  const breakEvenMonths = monthlyDiff !== 0 ? Math.ceil(pointsDiff / monthlyDiff) : 0

  return { winner, savings: Math.round(savings), breakEvenMonths }
}
