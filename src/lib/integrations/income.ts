/**
 * Mock Income Verification Integration
 *
 * Simulates income/employment verification for demo purposes.
 * Returns deterministic results based on input patterns.
 */

export type EmploymentStatus = 'Verified' | 'Unable to Verify' | 'Discrepancy Found'

export type IncomeVerification = {
  success: boolean
  referenceNumber: string
  verificationDate: string
  employer: {
    name: string
    verified: boolean
    phone?: string
    address?: string
  }
  employment: {
    status: EmploymentStatus
    startDate: string
    jobTitle: string
    employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Self-Employed'
  }
  income: {
    verified: boolean
    statedAnnual: number
    verifiedAnnual: number
    variance: number
    variancePercent: number
    withinTolerance: boolean
  }
  ytdEarnings?: number
  lastPayDate?: string
  payFrequency?: 'Weekly' | 'Bi-Weekly' | 'Semi-Monthly' | 'Monthly'
  notes: string[]
}

export type IncomeVerificationRequest = {
  employerName: string
  employerPhone?: string
  employerAddress?: string
  jobTitle: string
  startDate: string
  statedAnnualIncome: number
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Self-Employed'
  borrowerName: string
  ssn: string
}

/**
 * Determine verification outcome based on SSN pattern
 * Even SSNs: Clean verification
 * Odd SSNs ending in 1,3: Minor discrepancy
 * Odd SSNs ending in 5,7,9: Unable to verify
 */
function getVerificationOutcome(ssn: string): { status: EmploymentStatus; incomeVariance: number } {
  const lastDigit = parseInt(ssn.slice(-1), 10) || 0

  if (lastDigit % 2 === 0) {
    // Even - clean verification
    return { status: 'Verified', incomeVariance: 0 }
  } else if (lastDigit === 1 || lastDigit === 3) {
    // Minor discrepancy (income slightly different)
    return { status: 'Discrepancy Found', incomeVariance: -5000 }
  } else {
    // Unable to verify for demo
    return { status: 'Unable to Verify', incomeVariance: 0 }
  }
}

/**
 * Simulate income/employment verification
 */
export function verifyIncome(request: IncomeVerificationRequest): IncomeVerification {
  const { status, incomeVariance } = getVerificationOutcome(request.ssn)

  const verifiedAnnual = status === 'Unable to Verify'
    ? 0
    : request.statedAnnualIncome + incomeVariance

  const variance = verifiedAnnual - request.statedAnnualIncome
  const variancePercent = request.statedAnnualIncome > 0
    ? Math.round((variance / request.statedAnnualIncome) * 100)
    : 0

  // Tolerance is 10% variance
  const withinTolerance = Math.abs(variancePercent) <= 10

  const notes: string[] = []
  if (status === 'Verified') {
    notes.push('Employment and income verified successfully.')
    notes.push('Employer confirmed current employment status.')
  } else if (status === 'Discrepancy Found') {
    notes.push('Employment verified but income discrepancy found.')
    notes.push(`Stated income: $${request.statedAnnualIncome.toLocaleString()}`)
    notes.push(`Verified income: $${verifiedAnnual.toLocaleString()}`)
    if (withinTolerance) {
      notes.push('Variance is within acceptable tolerance.')
    } else {
      notes.push('Variance exceeds tolerance - additional documentation may be required.')
    }
  } else {
    notes.push('Unable to verify employment information.')
    notes.push('Employer did not respond to verification request.')
    notes.push('Manual verification or additional documentation required.')
  }

  // Calculate YTD based on current month
  const currentMonth = new Date().getMonth() + 1
  const monthlyIncome = verifiedAnnual / 12
  const ytdEarnings = Math.round(monthlyIncome * currentMonth)

  return {
    success: status !== 'Unable to Verify',
    referenceNumber: `IV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    verificationDate: new Date().toISOString(),
    employer: {
      name: request.employerName,
      verified: status !== 'Unable to Verify',
      phone: request.employerPhone,
      address: request.employerAddress
    },
    employment: {
      status,
      startDate: request.startDate,
      jobTitle: request.jobTitle,
      employmentType: request.employmentType
    },
    income: {
      verified: status === 'Verified' || status === 'Discrepancy Found',
      statedAnnual: request.statedAnnualIncome,
      verifiedAnnual,
      variance,
      variancePercent,
      withinTolerance
    },
    ytdEarnings: status !== 'Unable to Verify' ? ytdEarnings : undefined,
    lastPayDate: status !== 'Unable to Verify' ? getLastPayDate() : undefined,
    payFrequency: 'Bi-Weekly',
    notes
  }
}

/**
 * Get a realistic last pay date (most recent Friday)
 */
function getLastPayDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysToSubtract = dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2
  const lastFriday = new Date(today)
  lastFriday.setDate(today.getDate() - daysToSubtract)
  return lastFriday.toISOString().split('T')[0]
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDTI(
  monthlyIncome: number,
  monthlyDebts: number,
  proposedPayment: number
): { frontEnd: number; backEnd: number; withinLimits: boolean } {
  const frontEnd = monthlyIncome > 0
    ? Math.round((proposedPayment / monthlyIncome) * 100)
    : 0

  const backEnd = monthlyIncome > 0
    ? Math.round(((monthlyDebts + proposedPayment) / monthlyIncome) * 100)
    : 0

  // Standard limits: 28% front-end, 43% back-end
  const withinLimits = frontEnd <= 28 && backEnd <= 43

  return { frontEnd, backEnd, withinLimits }
}

/**
 * Get income stability score based on employment duration
 */
export function getIncomeStabilityScore(startDate: string): { score: number; rating: string } {
  const start = new Date(startDate)
  const now = new Date()
  const yearsEmployed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (yearsEmployed >= 5) return { score: 100, rating: 'Excellent' }
  if (yearsEmployed >= 3) return { score: 85, rating: 'Good' }
  if (yearsEmployed >= 2) return { score: 70, rating: 'Satisfactory' }
  if (yearsEmployed >= 1) return { score: 55, rating: 'Fair' }
  return { score: 40, rating: 'Limited History' }
}
