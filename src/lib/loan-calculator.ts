/**
 * Loan Calculator Utility Functions
 * Provides mortgage calculation formulas for the comparison tool
 */

export interface LoanScenarioInput {
  label: string;
  purchasePrice: number;
  downPayment: number;
  interestRate: number; // Annual rate as decimal (e.g., 0.0675 for 6.75%)
  termYears: number;
  annualPropertyTax?: number; // Optional, defaults to 1.2% of purchase price
  annualInsurance?: number; // Optional, defaults to 0.35% of purchase price
}

export interface LoanCalculationResult {
  label: string;
  loanAmount: number;
  monthlyPI: number; // Principal & Interest only
  monthlyPMI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyTotal: number; // P&I + PMI + Tax + Insurance
  totalPayments: number; // Total of all monthly payments over loan term
  totalInterest: number;
  ltvRatio: number;
  downPaymentPercent: number;
}

export interface ComparisonHighlights {
  lowestMonthlyPI: number;
  lowestMonthlyTotal: number;
  lowestTotalCost: number;
  lowestTotalInterest: number;
}

/**
 * Calculate monthly Principal & Interest payment
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 *   M = Monthly payment
 *   P = Principal (loan amount)
 *   r = Monthly interest rate (annual rate / 12)
 *   n = Total number of payments (term years * 12)
 */
export function calculateMonthlyPI(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);

  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;

  const factor = Math.pow(1 + monthlyRate, numPayments);
  const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);

  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Calculate LTV (Loan-to-Value) ratio
 */
export function calculateLTV(loanAmount: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0;
  return (loanAmount / propertyValue) * 100;
}

/**
 * Calculate monthly PMI estimate
 * PMI is typically required when LTV > 80%
 * Estimate: (loanAmount * 0.005) / 12 (0.5% annual PMI rate)
 */
export function calculateMonthlyPMI(loanAmount: number, ltv: number): number {
  if (ltv <= 80) return 0;

  // PMI rate varies by LTV, using tiered approach
  let pmiRate = 0.005; // 0.5% base rate
  if (ltv > 95) {
    pmiRate = 0.0095; // 0.95% for very high LTV
  } else if (ltv > 90) {
    pmiRate = 0.0075; // 0.75% for high LTV
  }

  return Math.round((loanAmount * pmiRate / 12) * 100) / 100;
}

/**
 * Calculate total interest paid over the life of the loan
 */
export function calculateTotalInterest(
  monthlyPI: number,
  termYears: number,
  principal: number
): number {
  const totalPayments = monthlyPI * termYears * 12;
  return Math.round((totalPayments - principal) * 100) / 100;
}

/**
 * Calculate complete loan scenario results
 */
export function calculateLoanScenario(input: LoanScenarioInput): LoanCalculationResult {
  const loanAmount = input.purchasePrice - input.downPayment;
  const ltvRatio = calculateLTV(loanAmount, input.purchasePrice);
  const downPaymentPercent = (input.downPayment / input.purchasePrice) * 100;

  const monthlyPI = calculateMonthlyPI(loanAmount, input.interestRate, input.termYears);
  const monthlyPMI = calculateMonthlyPMI(loanAmount, ltvRatio);

  // Default property tax: 1.2% of purchase price annually
  const annualTax = input.annualPropertyTax ?? input.purchasePrice * 0.012;
  const monthlyTax = Math.round((annualTax / 12) * 100) / 100;

  // Default insurance: 0.35% of purchase price annually
  const annualInsurance = input.annualInsurance ?? input.purchasePrice * 0.0035;
  const monthlyInsurance = Math.round((annualInsurance / 12) * 100) / 100;

  const monthlyTotal = Math.round((monthlyPI + monthlyPMI + monthlyTax + monthlyInsurance) * 100) / 100;

  // Total payments includes PMI only until LTV reaches 80% (estimated)
  // Simplified: assume PMI paid for first portion of loan
  const pmiMonths = ltvRatio > 80 ? Math.min(input.termYears * 12, Math.ceil((ltvRatio - 80) / 0.15 * 12)) : 0;
  const totalPMI = monthlyPMI * pmiMonths;

  const totalPI = monthlyPI * input.termYears * 12;
  const totalTax = monthlyTax * input.termYears * 12;
  const totalInsurance = monthlyInsurance * input.termYears * 12;
  const totalPayments = Math.round((totalPI + totalPMI + totalTax + totalInsurance) * 100) / 100;

  const totalInterest = calculateTotalInterest(monthlyPI, input.termYears, loanAmount);

  return {
    label: input.label,
    loanAmount: Math.round(loanAmount * 100) / 100,
    monthlyPI,
    monthlyPMI,
    monthlyTax,
    monthlyInsurance,
    monthlyTotal,
    totalPayments,
    totalInterest,
    ltvRatio: Math.round(ltvRatio * 100) / 100,
    downPaymentPercent: Math.round(downPaymentPercent * 100) / 100,
  };
}

/**
 * Find comparison highlights (best values across scenarios)
 */
export function findComparisonHighlights(results: LoanCalculationResult[]): ComparisonHighlights {
  if (results.length === 0) {
    return {
      lowestMonthlyPI: 0,
      lowestMonthlyTotal: 0,
      lowestTotalCost: 0,
      lowestTotalInterest: 0,
    };
  }

  return {
    lowestMonthlyPI: Math.min(...results.map(r => r.monthlyPI)),
    lowestMonthlyTotal: Math.min(...results.map(r => r.monthlyTotal)),
    lowestTotalCost: Math.min(...results.map(r => r.totalPayments)),
    lowestTotalInterest: Math.min(...results.map(r => r.totalInterest)),
  };
}

/**
 * Calculate difference from best value
 */
export function calculateDifference(value: number, best: number): number {
  return Math.round((value - best) * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format currency with cents for monthly payments
 */
export function formatCurrencyWithCents(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// Preset scenario configurations
export const PRESETS = {
  '15vs30': {
    name: '15yr vs 30yr',
    description: 'Compare different loan terms',
    scenarios: [
      { label: '30-Year Fixed', termYears: 30, interestRate: 0.0675 },
      { label: '15-Year Fixed', termYears: 15, interestRate: 0.0625 },
    ],
  },
  downPayment: {
    name: '5% vs 20% Down',
    description: 'Compare PMI impact',
    scenarios: [
      { label: '5% Down', downPaymentPercent: 5 },
      { label: '20% Down', downPaymentPercent: 20 },
    ],
  },
  convVsFha: {
    name: 'Conv vs FHA',
    description: 'Compare loan types',
    scenarios: [
      { label: 'Conventional', interestRate: 0.0675 },
      { label: 'FHA', interestRate: 0.065 },
    ],
  },
};

export type PresetKey = keyof typeof PRESETS;
