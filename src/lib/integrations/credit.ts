/**
 * Mock Credit Bureau Integration
 *
 * Simulates credit pull with deterministic scores based on SSN pattern.
 * This is for demo purposes only - no real credit data is pulled.
 */

export type CreditScore = {
  bureau: 'Equifax' | 'Experian' | 'TransUnion'
  score: number
  date: string
}

export type CreditTradeline = {
  creditor: string
  accountType: string
  balance: number
  creditLimit: number
  monthlyPayment: number
  status: 'Current' | 'Late30' | 'Late60' | 'Late90' | 'Collection' | 'ChargedOff'
  openDate: string
}

export type CreditReport = {
  success: boolean
  referenceNumber: string
  pullDate: string
  scores: CreditScore[]
  averageScore: number
  scoreCategory: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  tradelines: CreditTradeline[]
  totalDebt: number
  totalCreditLimit: number
  utilizationRate: number
  inquiries: number
  publicRecords: number
  collections: number
}

export type CreditPullRequest = {
  ssn: string
  firstName: string
  lastName: string
  dateOfBirth: string
  currentAddress: {
    street: string
    city: string
    state: string
    zip: string
  }
}

/**
 * Determines credit score based on SSN last digit for demo purposes
 * 0-2: Poor (500-649)
 * 3-4: Fair (650-699)
 * 5-6: Good (700-749)
 * 7-9: Excellent (750-850)
 */
function getScoreCategory(ssn: string): { category: 'Excellent' | 'Good' | 'Fair' | 'Poor'; baseScore: number } {
  const lastDigit = parseInt(ssn.slice(-1), 10) || 0

  if (lastDigit <= 2) {
    return { category: 'Poor', baseScore: 550 + lastDigit * 30 }
  } else if (lastDigit <= 4) {
    return { category: 'Fair', baseScore: 650 + (lastDigit - 3) * 25 }
  } else if (lastDigit <= 6) {
    return { category: 'Good', baseScore: 700 + (lastDigit - 5) * 25 }
  } else {
    return { category: 'Excellent', baseScore: 750 + (lastDigit - 7) * 30 }
  }
}

/**
 * Generate credit scores with slight variation between bureaus
 * Uses deterministic offsets for reproducible test results
 */
function generateScores(baseScore: number): CreditScore[] {
  const today = new Date().toISOString().split('T')[0]

  // Deterministic offsets for each bureau (no randomness)
  return [
    { bureau: 'Equifax', score: baseScore - 5, date: today },
    { bureau: 'Experian', score: baseScore + 3, date: today },
    { bureau: 'TransUnion', score: baseScore + 2, date: today },
  ]
}

/**
 * Generate sample tradelines based on score category
 */
function generateTradelines(category: string): CreditTradeline[] {
  const baseTradeLines: CreditTradeline[] = [
    {
      creditor: 'Chase Credit Card',
      accountType: 'Revolving',
      balance: 2500,
      creditLimit: 10000,
      monthlyPayment: 75,
      status: 'Current',
      openDate: '2020-03-15'
    },
    {
      creditor: 'Bank of America Auto Loan',
      accountType: 'Installment',
      balance: 15000,
      creditLimit: 25000,
      monthlyPayment: 450,
      status: 'Current',
      openDate: '2022-06-01'
    },
    {
      creditor: 'Capital One Card',
      accountType: 'Revolving',
      balance: 1200,
      creditLimit: 5000,
      monthlyPayment: 50,
      status: 'Current',
      openDate: '2019-09-20'
    }
  ]

  // Adjust based on credit category
  if (category === 'Poor') {
    baseTradeLines[0].status = 'Late30'
    baseTradeLines[0].balance = 8500
    baseTradeLines.push({
      creditor: 'Medical Collection',
      accountType: 'Collection',
      balance: 2500,
      creditLimit: 0,
      monthlyPayment: 0,
      status: 'Collection',
      openDate: '2023-01-15'
    })
  } else if (category === 'Fair') {
    baseTradeLines[0].balance = 6000
    baseTradeLines[0].status = 'Current'
  } else if (category === 'Good') {
    baseTradeLines[0].balance = 3000
    baseTradeLines[1].balance = 10000
  } else {
    // Excellent
    baseTradeLines[0].balance = 500
    baseTradeLines[1].balance = 5000
    baseTradeLines[0].creditLimit = 15000
    baseTradeLines.push({
      creditor: 'American Express Platinum',
      accountType: 'Revolving',
      balance: 0,
      creditLimit: 25000,
      monthlyPayment: 0,
      status: 'Current',
      openDate: '2018-05-10'
    })
  }

  return baseTradeLines
}

/**
 * Simulate a credit pull
 * Returns deterministic results based on SSN for demo reproducibility
 */
export function simulateCreditPull(request: CreditPullRequest): CreditReport {
  const { category, baseScore } = getScoreCategory(request.ssn)
  const scores = generateScores(baseScore)
  const averageScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / 3)
  const tradelines = generateTradelines(category)

  const totalDebt = tradelines.reduce((sum, t) => sum + t.balance, 0)
  const totalCreditLimit = tradelines
    .filter(t => t.accountType === 'Revolving')
    .reduce((sum, t) => sum + t.creditLimit, 0)

  const utilizationRate = totalCreditLimit > 0
    ? Math.round((tradelines.filter(t => t.accountType === 'Revolving').reduce((sum, t) => sum + t.balance, 0) / totalCreditLimit) * 100)
    : 0

  return {
    success: true,
    referenceNumber: `CR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    pullDate: new Date().toISOString(),
    scores,
    averageScore,
    scoreCategory: category,
    tradelines,
    totalDebt,
    totalCreditLimit,
    utilizationRate,
    inquiries: category === 'Poor' ? 5 : category === 'Fair' ? 3 : category === 'Good' ? 2 : 1,
    publicRecords: category === 'Poor' ? 1 : 0,
    collections: category === 'Poor' ? 1 : 0
  }
}

/**
 * Get credit score description for UI display
 */
export function getScoreDescription(score: number): string {
  if (score >= 750) return 'Excellent credit - Best rates available'
  if (score >= 700) return 'Good credit - Competitive rates'
  if (score >= 650) return 'Fair credit - Standard rates'
  return 'Poor credit - May require additional documentation'
}

/**
 * Get rate adjustment based on credit score
 * Returns basis points to add to base rate
 */
export function getCreditRateAdjustment(score: number): number {
  if (score >= 780) return -25 // -0.25%
  if (score >= 760) return 0
  if (score >= 740) return 25
  if (score >= 720) return 50
  if (score >= 700) return 75
  if (score >= 680) return 125
  if (score >= 660) return 175
  if (score >= 640) return 250
  return 350 // Poor credit
}
