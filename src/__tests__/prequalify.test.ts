import {
  calculateMonthlyPI,
  calculateMonthlyTaxesInsurance,
  calculateMaxLoanAmount,
  estimateLoanFromPayment,
  calculateDTI,
  calculatePrequalification,
  formatCurrency,
  formatPercent,
  formatDTI,
  getQualificationStatus,
  CREDIT_TIERS,
  type PrequalifyInput,
  type PrequalifyResult
} from '../lib/prequalify'

describe('Pre-Qualification Calculator', () => {
  describe('calculateMonthlyPI', () => {
    it('should calculate correct monthly P&I for standard loan', () => {
      // $300,000 loan at 6.5% for 30 years
      const payment = calculateMonthlyPI(300000, 0.065, 30)
      // Expected: ~$1896.20
      expect(payment).toBeCloseTo(1896.20, 0)
    })

    it('should calculate correct monthly P&I for 15-year loan', () => {
      // $300,000 loan at 6.5% for 15 years
      const payment = calculateMonthlyPI(300000, 0.065, 15)
      // Expected: ~$2613.32
      expect(payment).toBeCloseTo(2613.32, 0)
    })

    it('should return 0 for zero principal', () => {
      const payment = calculateMonthlyPI(0, 0.065, 30)
      expect(payment).toBe(0)
    })

    it('should return 0 for negative principal', () => {
      const payment = calculateMonthlyPI(-100000, 0.065, 30)
      expect(payment).toBe(0)
    })

    it('should handle zero interest rate (simple division)', () => {
      // $120,000 over 10 years with 0% interest
      const payment = calculateMonthlyPI(120000, 0, 10)
      // 120000 / 120 months = 1000
      expect(payment).toBe(1000)
    })
  })

  describe('calculateMonthlyTaxesInsurance', () => {
    it('should calculate 1.5% annual of home value divided by 12', () => {
      // $400,000 home -> $6,000/year -> $500/month
      const ti = calculateMonthlyTaxesInsurance(400000)
      expect(ti).toBe(500)
    })

    it('should return 0 for zero home value', () => {
      expect(calculateMonthlyTaxesInsurance(0)).toBe(0)
    })

    it('should return 0 for negative home value', () => {
      expect(calculateMonthlyTaxesInsurance(-100000)).toBe(0)
    })
  })

  describe('estimateLoanFromPayment', () => {
    it('should reverse calculate loan amount from monthly payment', () => {
      // Given a $1896.20 payment at 6.5% for 30 years, should get ~$300,000
      const loan = estimateLoanFromPayment(1896.20, 0.065, 30)
      expect(loan).toBeCloseTo(300000, -2) // Within $100
    })

    it('should return 0 for zero payment', () => {
      expect(estimateLoanFromPayment(0, 0.065, 30)).toBe(0)
    })

    it('should handle zero interest rate', () => {
      // $1000/month for 10 years = $120,000
      const loan = estimateLoanFromPayment(1000, 0, 10)
      expect(loan).toBe(120000)
    })
  })

  describe('calculateDTI', () => {
    it('should calculate correct DTI ratio', () => {
      // $3000 housing + $500 debt / $10000 monthly income = 35%
      const dti = calculateDTI(3000, 500, 120000) // 120000 annual = 10000 monthly
      expect(dti).toBeCloseTo(0.35, 2)
    })

    it('should return 1 (100%) for zero income', () => {
      expect(calculateDTI(3000, 500, 0)).toBe(1)
    })

    it('should handle zero debt payments', () => {
      const dti = calculateDTI(2000, 0, 60000) // 60000 annual = 5000 monthly
      expect(dti).toBeCloseTo(0.4, 2)
    })
  })

  describe('calculateMaxLoanAmount', () => {
    it('should calculate max loan based on 43% DTI', () => {
      // $100,000 annual income = $8,333 monthly
      // 43% DTI = $3,583 max total debt
      // With $500 existing debt = $3,083 available for housing
      const maxLoan = calculateMaxLoanAmount(100000, 500, 0.065, 30, 50000)
      // Should be a reasonable loan amount (around $400k for this income)
      expect(maxLoan).toBeGreaterThan(350000)
      expect(maxLoan).toBeLessThan(600000)
    })

    it('should return 0 for zero income', () => {
      const maxLoan = calculateMaxLoanAmount(0, 500, 0.065, 30, 50000)
      expect(maxLoan).toBe(0)
    })

    it('should return 0 when debt exceeds DTI limit', () => {
      // $50,000 annual income = $4,166 monthly
      // 43% DTI = $1,791 max
      // $2,000 existing debt exceeds limit
      const maxLoan = calculateMaxLoanAmount(50000, 2000, 0.065, 30, 0)
      expect(maxLoan).toBe(0)
    })

    it('should calculate higher max for lower rates', () => {
      const maxLoanHighRate = calculateMaxLoanAmount(100000, 0, 0.0775, 30, 0)
      const maxLoanLowRate = calculateMaxLoanAmount(100000, 0, 0.065, 30, 0)
      expect(maxLoanLowRate).toBeGreaterThan(maxLoanHighRate)
    })

    it('should round down to nearest $1000', () => {
      const maxLoan = calculateMaxLoanAmount(100000, 0, 0.065, 30, 0)
      expect(maxLoan % 1000).toBe(0)
    })
  })

  describe('calculatePrequalification', () => {
    const baseInput: PrequalifyInput = {
      annualGrossIncome: 100000,
      monthlyDebtPayments: 500,
      creditScoreTier: 'good',
      downPayment: 50000,
      loanTerm: 30,
      propertyType: 'single_family',
      occupancy: 'primary'
    }

    it('should return qualified result for good inputs', () => {
      const result = calculatePrequalification(baseInput)
      expect(result.qualified).toBe(true)
      expect(result.maxLoanAmount).toBeGreaterThan(0)
      expect(result.maxPurchasePrice).toBeGreaterThan(result.maxLoanAmount)
      expect(result.dtiRatio).toBeLessThanOrEqual(0.43)
    })

    it('should use correct interest rate for credit tier', () => {
      const excellentResult = calculatePrequalification({
        ...baseInput,
        creditScoreTier: 'excellent'
      })
      const belowFairResult = calculatePrequalification({
        ...baseInput,
        creditScoreTier: 'below_fair'
      })

      expect(excellentResult.interestRate).toBe(CREDIT_TIERS.excellent.rate)
      expect(belowFairResult.interestRate).toBe(CREDIT_TIERS.below_fair.rate)
      expect(excellentResult.maxLoanAmount).toBeGreaterThan(belowFairResult.maxLoanAmount)
    })

    it('should add warning for DTI above 36%', () => {
      const result = calculatePrequalification({
        ...baseInput,
        annualGrossIncome: 60000,
        monthlyDebtPayments: 800
      })

      if (result.dtiRatio > 0.36 && result.dtiRatio <= 0.43) {
        expect(result.warnings.some(w => w.includes('36%'))).toBe(true)
      }
    })

    it('should not qualify when DTI exceeds 43%', () => {
      const result = calculatePrequalification({
        ...baseInput,
        annualGrossIncome: 40000,
        monthlyDebtPayments: 1500
      })

      expect(result.qualified).toBe(false)
      expect(result.warnings.some(w => w.includes('43%'))).toBe(true)
    })

    it('should add warning for below_fair credit', () => {
      const result = calculatePrequalification({
        ...baseInput,
        creditScoreTier: 'below_fair'
      })

      expect(result.warnings.some(w => w.includes('650'))).toBe(true)
    })

    it('should add warning for investment properties', () => {
      const result = calculatePrequalification({
        ...baseInput,
        occupancy: 'investment'
      })

      expect(result.warnings.some(w => w.includes('Investment'))).toBe(true)
    })

    it('should add warning for multi-unit properties', () => {
      const result = calculatePrequalification({
        ...baseInput,
        propertyType: 'multi_unit'
      })

      expect(result.warnings.some(w => w.includes('Multi-unit'))).toBe(true)
    })

    it('should calculate max purchase price as loan + down payment', () => {
      const result = calculatePrequalification(baseInput)
      expect(result.maxPurchasePrice).toBe(result.maxLoanAmount + baseInput.downPayment)
    })

    it('should calculate monthly payment as P&I + T&I', () => {
      const result = calculatePrequalification(baseInput)
      expect(result.estimatedMonthlyPayment).toBeCloseTo(
        result.principalAndInterest + result.taxesAndInsurance,
        2
      )
    })

    it('should handle 15-year term', () => {
      const result30 = calculatePrequalification(baseInput)
      const result15 = calculatePrequalification({
        ...baseInput,
        loanTerm: 15
      })

      // 15-year should have higher monthly payment for same loan
      // But lower max loan due to higher payments
      expect(result15.maxLoanAmount).toBeLessThan(result30.maxLoanAmount)
    })
  })

  describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
      expect(formatCurrency(350000)).toBe('$350,000')
      expect(formatCurrency(1500.5)).toBe('$1,501') // Rounded
      expect(formatCurrency(0)).toBe('$0')
    })
  })

  describe('formatPercent', () => {
    it('should format decimals as percentages', () => {
      expect(formatPercent(0.065)).toBe('6.50%')
      expect(formatPercent(0.0775)).toBe('7.75%')
    })
  })

  describe('formatDTI', () => {
    it('should format DTI with one decimal place', () => {
      expect(formatDTI(0.35)).toBe('35.0%')
      expect(formatDTI(0.428)).toBe('42.8%')
    })
  })

  describe('getQualificationStatus', () => {
    it('should return qualified for good results', () => {
      const result: PrequalifyResult = {
        maxLoanAmount: 400000,
        estimatedMonthlyPayment: 2500,
        principalAndInterest: 2000,
        taxesAndInsurance: 500,
        interestRate: 0.065,
        dtiRatio: 0.32,
        maxPurchasePrice: 450000,
        qualified: true,
        warnings: []
      }
      expect(getQualificationStatus(result)).toBe('qualified')
    })

    it('should return warning for high DTI', () => {
      const result: PrequalifyResult = {
        maxLoanAmount: 300000,
        estimatedMonthlyPayment: 2200,
        principalAndInterest: 1800,
        taxesAndInsurance: 400,
        interestRate: 0.065,
        dtiRatio: 0.40,
        maxPurchasePrice: 350000,
        qualified: true,
        warnings: ['DTI above 36%']
      }
      expect(getQualificationStatus(result)).toBe('warning')
    })

    it('should return not_qualified when not qualified', () => {
      const result: PrequalifyResult = {
        maxLoanAmount: 0,
        estimatedMonthlyPayment: 0,
        principalAndInterest: 0,
        taxesAndInsurance: 0,
        interestRate: 0.065,
        dtiRatio: 0.50,
        maxPurchasePrice: 0,
        qualified: false,
        warnings: ['DTI exceeds 43%']
      }
      expect(getQualificationStatus(result)).toBe('not_qualified')
    })
  })

  describe('CREDIT_TIERS', () => {
    it('should have correct rate tiers', () => {
      expect(CREDIT_TIERS.excellent.rate).toBe(0.065)
      expect(CREDIT_TIERS.good.rate).toBe(0.06875)
      expect(CREDIT_TIERS.fair.rate).toBe(0.0725)
      expect(CREDIT_TIERS.below_fair.rate).toBe(0.0775)
    })

    it('should have labels for all tiers', () => {
      expect(CREDIT_TIERS.excellent.label).toContain('750')
      expect(CREDIT_TIERS.good.label).toContain('700')
      expect(CREDIT_TIERS.fair.label).toContain('650')
      expect(CREDIT_TIERS.below_fair.label).toContain('650')
    })
  })
})
