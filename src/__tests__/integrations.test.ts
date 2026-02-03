import {
  simulateCreditPull,
  getScoreDescription,
  getCreditRateAdjustment,
  type CreditPullRequest
} from '../lib/integrations/credit'

import {
  verifyIncome,
  calculateDTI,
  getIncomeStabilityScore,
  type IncomeVerificationRequest
} from '../lib/integrations/income'

import {
  calculatePricing,
  getRateQuoteSummary,
  compareScenarios,
  type PricingRequest
} from '../lib/integrations/pricing'

describe('Credit Integration', () => {
  describe('simulateCreditPull', () => {
    const baseRequest: CreditPullRequest = {
      ssn: '123-45-6789',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-15',
      currentAddress: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701'
      }
    }

    it('should return excellent credit for SSN ending in 7-9', () => {
      const request = { ...baseRequest, ssn: '123-45-6789' } // ends in 9
      const result = simulateCreditPull(request)
      expect(result.success).toBe(true)
      expect(result.scoreCategory).toBe('Excellent')
      expect(result.averageScore).toBeGreaterThanOrEqual(750)
    })

    it('should return good credit for SSN ending in 5-6', () => {
      const request = { ...baseRequest, ssn: '123-45-6785' } // ends in 5
      const result = simulateCreditPull(request)
      expect(result.scoreCategory).toBe('Good')
      expect(result.averageScore).toBeGreaterThanOrEqual(700)
      expect(result.averageScore).toBeLessThan(750)
    })

    it('should return fair credit for SSN ending in 3-4', () => {
      const request = { ...baseRequest, ssn: '123-45-6784' } // ends in 4
      const result = simulateCreditPull(request)
      expect(result.scoreCategory).toBe('Fair')
      expect(result.averageScore).toBeGreaterThanOrEqual(650)
      expect(result.averageScore).toBeLessThan(700)
    })

    it('should return poor credit for SSN ending in 0-2', () => {
      const request = { ...baseRequest, ssn: '123-45-6780' } // ends in 0
      const result = simulateCreditPull(request)
      expect(result.scoreCategory).toBe('Poor')
      expect(result.averageScore).toBeLessThan(650)
    })

    it('should return three bureau scores', () => {
      const result = simulateCreditPull(baseRequest)
      expect(result.scores).toHaveLength(3)
      expect(result.scores.map(s => s.bureau)).toContain('Equifax')
      expect(result.scores.map(s => s.bureau)).toContain('Experian')
      expect(result.scores.map(s => s.bureau)).toContain('TransUnion')
    })

    it('should include tradelines', () => {
      const result = simulateCreditPull(baseRequest)
      expect(result.tradelines.length).toBeGreaterThan(0)
    })

    it('should calculate utilization rate', () => {
      const result = simulateCreditPull(baseRequest)
      expect(result.utilizationRate).toBeGreaterThanOrEqual(0)
      expect(result.utilizationRate).toBeLessThanOrEqual(100)
    })

    it('should include collection on poor credit', () => {
      const request = { ...baseRequest, ssn: '123-45-6780' } // Poor credit
      const result = simulateCreditPull(request)
      expect(result.collections).toBeGreaterThan(0)
    })

    it('should have no collections on excellent credit', () => {
      const request = { ...baseRequest, ssn: '123-45-6789' } // Excellent credit
      const result = simulateCreditPull(request)
      expect(result.collections).toBe(0)
    })
  })

  describe('getScoreDescription', () => {
    it('should return excellent description for score >= 750', () => {
      expect(getScoreDescription(780)).toBe('Excellent credit - Best rates available')
    })

    it('should return good description for score >= 700', () => {
      expect(getScoreDescription(720)).toBe('Good credit - Competitive rates')
    })

    it('should return fair description for score >= 650', () => {
      expect(getScoreDescription(660)).toBe('Fair credit - Standard rates')
    })

    it('should return poor description for score < 650', () => {
      expect(getScoreDescription(600)).toBe('Poor credit - May require additional documentation')
    })
  })

  describe('getCreditRateAdjustment', () => {
    it('should return negative adjustment for excellent credit', () => {
      expect(getCreditRateAdjustment(780)).toBe(-25)
    })

    it('should return zero for 760+ credit', () => {
      expect(getCreditRateAdjustment(765)).toBe(0)
    })

    it('should return positive adjustment for lower credit', () => {
      expect(getCreditRateAdjustment(700)).toBe(75)
      expect(getCreditRateAdjustment(640)).toBe(250)
      expect(getCreditRateAdjustment(600)).toBe(350)
    })
  })
})

describe('Income Integration', () => {
  describe('verifyIncome', () => {
    const baseRequest: IncomeVerificationRequest = {
      employerName: 'Acme Corp',
      jobTitle: 'Software Engineer',
      startDate: '2020-01-15',
      statedAnnualIncome: 120000,
      employmentType: 'Full-Time',
      borrowerName: 'John Doe',
      ssn: '123-45-6788' // Even = verified
    }

    it('should verify income for even SSN', () => {
      const result = verifyIncome(baseRequest)
      expect(result.success).toBe(true)
      expect(result.employment.status).toBe('Verified')
      expect(result.income.verified).toBe(true)
      expect(result.income.variance).toBe(0)
    })

    it('should find discrepancy for SSN ending in 1 or 3', () => {
      const request = { ...baseRequest, ssn: '123-45-6781' } // ends in 1
      const result = verifyIncome(request)
      expect(result.success).toBe(true)
      expect(result.employment.status).toBe('Discrepancy Found')
      expect(result.income.variance).toBe(-5000)
      expect(result.income.verifiedAnnual).toBe(115000)
    })

    it('should be unable to verify for SSN ending in 5, 7, or 9', () => {
      const request = { ...baseRequest, ssn: '123-45-6785' } // ends in 5
      const result = verifyIncome(request)
      expect(result.success).toBe(false)
      expect(result.employment.status).toBe('Unable to Verify')
      expect(result.income.verifiedAnnual).toBe(0)
    })

    it('should include employer verification', () => {
      const result = verifyIncome(baseRequest)
      expect(result.employer.name).toBe('Acme Corp')
      expect(result.employer.verified).toBe(true)
    })

    it('should include notes explaining result', () => {
      const result = verifyIncome(baseRequest)
      expect(result.notes.length).toBeGreaterThan(0)
    })

    it('should calculate variance percentage', () => {
      const request = { ...baseRequest, ssn: '123-45-6781' } // Discrepancy
      const result = verifyIncome(request)
      expect(result.income.variancePercent).toBeCloseTo(-4, 0) // -5000 / 120000 = -4.17%
    })
  })

  describe('calculateDTI', () => {
    it('should calculate front-end DTI correctly', () => {
      const result = calculateDTI(10000, 2000, 2500)
      expect(result.frontEnd).toBe(25) // 2500 / 10000 = 25%
    })

    it('should calculate back-end DTI correctly', () => {
      const result = calculateDTI(10000, 2000, 2500)
      expect(result.backEnd).toBe(45) // (2000 + 2500) / 10000 = 45%
    })

    it('should return within limits for acceptable DTI', () => {
      const result = calculateDTI(10000, 1000, 2000)
      expect(result.frontEnd).toBe(20)
      expect(result.backEnd).toBe(30)
      expect(result.withinLimits).toBe(true)
    })

    it('should return not within limits for high DTI', () => {
      const result = calculateDTI(10000, 3000, 3000)
      expect(result.backEnd).toBe(60)
      expect(result.withinLimits).toBe(false)
    })

    it('should handle zero income', () => {
      const result = calculateDTI(0, 1000, 2000)
      expect(result.frontEnd).toBe(0)
      expect(result.backEnd).toBe(0)
    })
  })

  describe('getIncomeStabilityScore', () => {
    it('should return excellent for 5+ years', () => {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 6)
      const result = getIncomeStabilityScore(fiveYearsAgo.toISOString().split('T')[0])
      expect(result.score).toBe(100)
      expect(result.rating).toBe('Excellent')
    })

    it('should return good for 3-5 years', () => {
      const threeYearsAgo = new Date()
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 4)
      const result = getIncomeStabilityScore(threeYearsAgo.toISOString().split('T')[0])
      expect(result.score).toBe(85)
      expect(result.rating).toBe('Good')
    })

    it('should return satisfactory for 2-3 years', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 6)
      const result = getIncomeStabilityScore(twoYearsAgo.toISOString().split('T')[0])
      expect(result.score).toBe(70)
      expect(result.rating).toBe('Satisfactory')
    })

    it('should return limited history for < 1 year', () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const result = getIncomeStabilityScore(sixMonthsAgo.toISOString().split('T')[0])
      expect(result.score).toBe(40)
      expect(result.rating).toBe('Limited History')
    })
  })
})

describe('Pricing Integration', () => {
  describe('calculatePricing', () => {
    const baseRequest: PricingRequest = {
      loanAmount: 280000,
      propertyValue: 350000,
      creditScore: 750,
      loanType: 'Conventional',
      loanPurpose: 'Purchase',
      termMonths: 360,
      propertyOccupancy: 'PrimaryResidence',
      propertyType: 'SingleFamily',
      state: 'IL'
    }

    it('should return successful pricing result', () => {
      const result = calculatePricing(baseRequest)
      expect(result.success).toBe(true)
      expect(result.scenarios.length).toBeGreaterThan(0)
    })

    it('should include three pricing scenarios (0, 1, 2 points)', () => {
      const result = calculatePricing(baseRequest)
      expect(result.scenarios).toHaveLength(3)
      expect(result.scenarios[0].points).toBe(0)
      expect(result.scenarios[1].points).toBe(1)
      expect(result.scenarios[2].points).toBe(2)
    })

    it('should have lower rate with more points', () => {
      const result = calculatePricing(baseRequest)
      expect(result.scenarios[0].rate).toBeGreaterThan(result.scenarios[1].rate)
      expect(result.scenarios[1].rate).toBeGreaterThan(result.scenarios[2].rate)
    })

    it('should calculate LTV correctly', () => {
      const result = calculatePricing(baseRequest)
      expect(result.loanDetails.ltv).toBe(80) // 280000/350000 = 80%
    })

    it('should include closing costs', () => {
      const result = calculatePricing(baseRequest)
      expect(result.fees.totalClosingCosts).toBeGreaterThan(0)
      expect(result.fees.originationFee).toBe(2800) // 1% of loan
    })

    it('should include monthly breakdown', () => {
      const result = calculatePricing(baseRequest)
      expect(result.monthlyBreakdown.total).toBeGreaterThan(0)
      expect(result.monthlyBreakdown.principal).toBeDefined()
      expect(result.monthlyBreakdown.interest).toBeDefined()
      expect(result.monthlyBreakdown.taxes).toBeGreaterThan(0)
      expect(result.monthlyBreakdown.insurance).toBeGreaterThan(0)
    })

    it('should not include PMI for 80% LTV', () => {
      const result = calculatePricing(baseRequest)
      expect(result.monthlyBreakdown.pmi).toBe(0)
    })

    it('should include PMI for high LTV', () => {
      const highLTVRequest = { ...baseRequest, loanAmount: 315000 } // 90% LTV
      const result = calculatePricing(highLTVRequest)
      expect(result.monthlyBreakdown.pmi).toBeGreaterThan(0)
    })

    it('should apply credit score adjustment', () => {
      const lowCreditRequest = { ...baseRequest, creditScore: 650 }
      const highCreditRequest = { ...baseRequest, creditScore: 780 }

      const lowResult = calculatePricing(lowCreditRequest)
      const highResult = calculatePricing(highCreditRequest)

      expect(lowResult.scenarios[0].rate).toBeGreaterThan(highResult.scenarios[0].rate)
    })

    it('should apply property type adjustment', () => {
      const condoRequest = { ...baseRequest, propertyType: 'Condo' as const }
      const singleFamilyResult = calculatePricing(baseRequest)
      const condoResult = calculatePricing(condoRequest)

      expect(condoResult.scenarios[0].rate).toBeGreaterThan(singleFamilyResult.scenarios[0].rate)
    })

    it('should apply occupancy adjustment', () => {
      const investmentRequest = { ...baseRequest, propertyOccupancy: 'Investment' as const }
      const primaryResult = calculatePricing(baseRequest)
      const investmentResult = calculatePricing(investmentRequest)

      expect(investmentResult.scenarios[0].rate).toBeGreaterThan(primaryResult.scenarios[0].rate)
    })

    it('should apply term adjustment for 15-year loan', () => {
      const fifteenYearRequest = { ...baseRequest, termMonths: 180 }
      const thirtyYearResult = calculatePricing(baseRequest)
      const fifteenYearResult = calculatePricing(fifteenYearRequest)

      expect(fifteenYearResult.scenarios[0].rate).toBeLessThan(thirtyYearResult.scenarios[0].rate)
    })

    it('should include rate adjustments breakdown', () => {
      const result = calculatePricing(baseRequest)
      expect(Array.isArray(result.adjustments)).toBe(true)
    })

    it('should include notes', () => {
      const result = calculatePricing(baseRequest)
      expect(result.notes.length).toBeGreaterThan(0)
    })
  })

  describe('getRateQuoteSummary', () => {
    it('should format rate quote summary', () => {
      const baseRequest: PricingRequest = {
        loanAmount: 280000,
        propertyValue: 350000,
        creditScore: 750,
        loanType: 'Conventional',
        loanPurpose: 'Purchase',
        termMonths: 360,
        propertyOccupancy: 'PrimaryResidence',
        propertyType: 'SingleFamily',
        state: 'IL'
      }
      const result = calculatePricing(baseRequest)
      const summary = getRateQuoteSummary(result)

      expect(summary).toContain('%')
      expect(summary).toContain('rate')
      expect(summary).toContain('APR')
      expect(summary).toContain('/month')
    })
  })

  describe('compareScenarios', () => {
    it('should determine winner based on hold period', () => {
      const scenario1 = {
        rate: 6.75,
        apr: 6.80,
        points: 0,
        pointsCost: 0,
        monthlyPayment: 1817,
        totalInterest: 374000,
        totalCost: 374000,
        label: 'No Points'
      }
      const scenario2 = {
        rate: 6.50,
        apr: 6.70,
        points: 1,
        pointsCost: 2800,
        monthlyPayment: 1770,
        totalInterest: 357000,
        totalCost: 359800,
        label: '1 Point'
      }

      // Short hold - no points wins
      const shortHold = compareScenarios(scenario1, scenario2, 2)
      expect(shortHold.winner).toBe(1)

      // Long hold - points wins
      const longHold = compareScenarios(scenario1, scenario2, 10)
      expect(longHold.winner).toBe(2)
    })

    it('should calculate break-even months', () => {
      const scenario1 = {
        rate: 6.75,
        apr: 6.80,
        points: 0,
        pointsCost: 0,
        monthlyPayment: 2000,
        totalInterest: 0,
        totalCost: 0,
        label: 'No Points'
      }
      const scenario2 = {
        rate: 6.50,
        apr: 6.70,
        points: 1,
        pointsCost: 3000,
        monthlyPayment: 1900,
        totalInterest: 0,
        totalCost: 0,
        label: '1 Point'
      }

      const comparison = compareScenarios(scenario1, scenario2, 5)
      // Break-even: 3000 / (2000 - 1900) = 30 months
      expect(comparison.breakEvenMonths).toBe(30)
    })
  })
})
