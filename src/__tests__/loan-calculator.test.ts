import {
  calculateMonthlyPI,
  calculateLTV,
  calculateMonthlyPMI,
  calculateTotalInterest,
  calculateLoanScenario,
  findComparisonHighlights,
  calculateDifference,
  formatCurrency,
  formatCurrencyWithCents,
  formatPercent,
  LoanScenarioInput,
  LoanCalculationResult,
} from '../lib/loan-calculator';

describe('Loan Calculator', () => {
  describe('calculateMonthlyPI', () => {
    it('calculates monthly payment correctly for standard 30-year loan', () => {
      // $400,000 loan at 6.75% for 30 years
      const payment = calculateMonthlyPI(400000, 0.0675, 30);
      // Expected: approximately $2,594.44
      expect(payment).toBeCloseTo(2594.44, 0);
    });

    it('calculates monthly payment correctly for 15-year loan', () => {
      // $400,000 loan at 6.25% for 15 years
      const payment = calculateMonthlyPI(400000, 0.0625, 15);
      // Expected: approximately $3,429.69
      expect(payment).toBeCloseTo(3429.69, 0);
    });

    it('returns 0 for zero principal', () => {
      const payment = calculateMonthlyPI(0, 0.0675, 30);
      expect(payment).toBe(0);
    });

    it('handles zero interest rate', () => {
      // $120,000 loan at 0% for 30 years = $333.33/month
      const payment = calculateMonthlyPI(120000, 0, 30);
      expect(payment).toBeCloseTo(333.33, 0);
    });

    it('calculates correctly for 20-year loan', () => {
      // $300,000 loan at 7% for 20 years
      const payment = calculateMonthlyPI(300000, 0.07, 20);
      // Expected: approximately $2,325.89
      expect(payment).toBeCloseTo(2325.89, 0);
    });
  });

  describe('calculateLTV', () => {
    it('calculates LTV correctly', () => {
      // $320,000 loan on $400,000 property = 80%
      const ltv = calculateLTV(320000, 400000);
      expect(ltv).toBe(80);
    });

    it('calculates high LTV correctly', () => {
      // $380,000 loan on $400,000 property = 95%
      const ltv = calculateLTV(380000, 400000);
      expect(ltv).toBe(95);
    });

    it('returns 0 for zero property value', () => {
      const ltv = calculateLTV(100000, 0);
      expect(ltv).toBe(0);
    });

    it('calculates LTV below 80%', () => {
      // $300,000 loan on $500,000 property = 60%
      const ltv = calculateLTV(300000, 500000);
      expect(ltv).toBe(60);
    });
  });

  describe('calculateMonthlyPMI', () => {
    it('returns 0 for LTV at or below 80%', () => {
      const pmi = calculateMonthlyPMI(320000, 80);
      expect(pmi).toBe(0);
    });

    it('calculates PMI for LTV between 80% and 90%', () => {
      // $340,000 loan at 85% LTV
      // Base PMI rate: 0.5%
      const pmi = calculateMonthlyPMI(340000, 85);
      // Expected: (340000 * 0.005) / 12 = $141.67
      expect(pmi).toBeCloseTo(141.67, 0);
    });

    it('calculates PMI for LTV between 90% and 95%', () => {
      // $360,000 loan at 92% LTV
      // PMI rate: 0.75%
      const pmi = calculateMonthlyPMI(360000, 92);
      // Expected: (360000 * 0.0075) / 12 = $225
      expect(pmi).toBeCloseTo(225, 0);
    });

    it('calculates PMI for LTV above 95%', () => {
      // $380,000 loan at 97% LTV
      // PMI rate: 0.95%
      const pmi = calculateMonthlyPMI(380000, 97);
      // Expected: (380000 * 0.0095) / 12 = $300.83
      expect(pmi).toBeCloseTo(300.83, 0);
    });
  });

  describe('calculateTotalInterest', () => {
    it('calculates total interest correctly', () => {
      // $2,594 monthly payment for 30 years on $400,000 loan
      const totalInterest = calculateTotalInterest(2594.44, 30, 400000);
      // Total payments: 2594.44 * 360 = 933,998.40
      // Total interest: 933,998.40 - 400,000 = 533,998.40
      expect(totalInterest).toBeCloseTo(533998.4, 0);
    });

    it('calculates total interest for 15-year loan', () => {
      // $3,439 monthly payment for 15 years on $400,000 loan
      const totalInterest = calculateTotalInterest(3439.04, 15, 400000);
      // Total payments: 3439.04 * 180 = 619,027.20
      // Total interest: 619,027.20 - 400,000 = 219,027.20
      expect(totalInterest).toBeCloseTo(219027.2, 0);
    });
  });

  describe('calculateLoanScenario', () => {
    it('calculates complete scenario for standard loan', () => {
      const input: LoanScenarioInput = {
        label: 'Test Scenario',
        purchasePrice: 400000,
        downPayment: 80000,
        interestRate: 0.0675,
        termYears: 30,
      };

      const result = calculateLoanScenario(input);

      expect(result.label).toBe('Test Scenario');
      expect(result.loanAmount).toBe(320000);
      expect(result.ltvRatio).toBe(80);
      expect(result.downPaymentPercent).toBe(20);
      expect(result.monthlyPI).toBeCloseTo(2075.55, 0);
      expect(result.monthlyPMI).toBe(0); // LTV = 80%, no PMI
      expect(result.monthlyTax).toBeCloseTo(400, 0); // 1.2% of $400k / 12
      expect(result.monthlyInsurance).toBeCloseTo(116.67, 0); // 0.35% of $400k / 12
    });

    it('calculates scenario with PMI', () => {
      const input: LoanScenarioInput = {
        label: '5% Down Scenario',
        purchasePrice: 400000,
        downPayment: 20000, // 5% down
        interestRate: 0.0675,
        termYears: 30,
      };

      const result = calculateLoanScenario(input);

      expect(result.loanAmount).toBe(380000);
      expect(result.ltvRatio).toBe(95);
      expect(result.downPaymentPercent).toBe(5);
      expect(result.monthlyPMI).toBeGreaterThan(0);
    });

    it('uses custom tax and insurance when provided', () => {
      const input: LoanScenarioInput = {
        label: 'Custom Estimates',
        purchasePrice: 400000,
        downPayment: 80000,
        interestRate: 0.0675,
        termYears: 30,
        annualPropertyTax: 6000, // $500/month
        annualInsurance: 2400, // $200/month
      };

      const result = calculateLoanScenario(input);

      expect(result.monthlyTax).toBe(500);
      expect(result.monthlyInsurance).toBe(200);
    });
  });

  describe('findComparisonHighlights', () => {
    it('finds lowest values across scenarios', () => {
      const results: LoanCalculationResult[] = [
        {
          label: 'Scenario 1',
          loanAmount: 320000,
          monthlyPI: 2000,
          monthlyPMI: 0,
          monthlyTax: 400,
          monthlyInsurance: 120,
          monthlyTotal: 2520,
          totalPayments: 907200,
          totalInterest: 400000,
          ltvRatio: 80,
          downPaymentPercent: 20,
        },
        {
          label: 'Scenario 2',
          loanAmount: 320000,
          monthlyPI: 2500,
          monthlyPMI: 0,
          monthlyTax: 400,
          monthlyInsurance: 120,
          monthlyTotal: 3020,
          totalPayments: 544320,
          totalInterest: 200000,
          ltvRatio: 80,
          downPaymentPercent: 20,
        },
      ];

      const highlights = findComparisonHighlights(results);

      expect(highlights.lowestMonthlyPI).toBe(2000);
      expect(highlights.lowestMonthlyTotal).toBe(2520);
      expect(highlights.lowestTotalCost).toBe(544320);
      expect(highlights.lowestTotalInterest).toBe(200000);
    });

    it('returns zeros for empty array', () => {
      const highlights = findComparisonHighlights([]);

      expect(highlights.lowestMonthlyPI).toBe(0);
      expect(highlights.lowestMonthlyTotal).toBe(0);
      expect(highlights.lowestTotalCost).toBe(0);
      expect(highlights.lowestTotalInterest).toBe(0);
    });
  });

  describe('calculateDifference', () => {
    it('calculates positive difference', () => {
      const diff = calculateDifference(2500, 2000);
      expect(diff).toBe(500);
    });

    it('returns 0 when values are equal', () => {
      const diff = calculateDifference(2000, 2000);
      expect(diff).toBe(0);
    });

    it('rounds to 2 decimal places', () => {
      const diff = calculateDifference(2500.567, 2000.123);
      expect(diff).toBe(500.44);
    });
  });

  describe('formatCurrency', () => {
    it('formats currency without cents', () => {
      expect(formatCurrency(400000)).toBe('$400,000');
    });

    it('formats small amounts', () => {
      expect(formatCurrency(500)).toBe('$500');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });
  });

  describe('formatCurrencyWithCents', () => {
    it('formats currency with cents', () => {
      expect(formatCurrencyWithCents(2594.44)).toBe('$2,594.44');
    });

    it('pads cents when needed', () => {
      expect(formatCurrencyWithCents(2000)).toBe('$2,000.00');
    });
  });

  describe('formatPercent', () => {
    it('formats percentage with default decimals', () => {
      expect(formatPercent(6.75)).toBe('6.75%');
    });

    it('formats percentage with custom decimals', () => {
      expect(formatPercent(80.5, 1)).toBe('80.5%');
    });

    it('formats percentage with no decimals', () => {
      expect(formatPercent(95, 0)).toBe('95%');
    });
  });

  describe('Real-world scenarios', () => {
    it('compares 15yr vs 30yr correctly', () => {
      const thirtyYear = calculateLoanScenario({
        label: '30-Year Fixed',
        purchasePrice: 400000,
        downPayment: 80000,
        interestRate: 0.0675,
        termYears: 30,
      });

      const fifteenYear = calculateLoanScenario({
        label: '15-Year Fixed',
        purchasePrice: 400000,
        downPayment: 80000,
        interestRate: 0.0625,
        termYears: 15,
      });

      // 15-year should have higher monthly payment but lower total interest
      expect(fifteenYear.monthlyPI).toBeGreaterThan(thirtyYear.monthlyPI);
      expect(fifteenYear.totalInterest).toBeLessThan(thirtyYear.totalInterest);
    });

    it('compares 5% vs 20% down correctly', () => {
      const fivePercent = calculateLoanScenario({
        label: '5% Down',
        purchasePrice: 400000,
        downPayment: 20000,
        interestRate: 0.0675,
        termYears: 30,
      });

      const twentyPercent = calculateLoanScenario({
        label: '20% Down',
        purchasePrice: 400000,
        downPayment: 80000,
        interestRate: 0.0675,
        termYears: 30,
      });

      // 5% down should have higher monthly payment and PMI
      expect(fivePercent.monthlyPI).toBeGreaterThan(twentyPercent.monthlyPI);
      expect(fivePercent.monthlyPMI).toBeGreaterThan(0);
      expect(twentyPercent.monthlyPMI).toBe(0);
      expect(fivePercent.ltvRatio).toBe(95);
      expect(twentyPercent.ltvRatio).toBe(80);
    });
  });
});
