# COMPARE-01: Loan Comparison Tool

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | COMPARE-01 |
| **Title** | Loan Comparison Tool |
| **Status** | TODO |
| **Priority** | Medium |
| **Estimated Complexity** | Medium |
| **Dependencies** | None |

---

## Description

Create a `/compare` page that allows users to compare different loan scenarios side-by-side. Users can adjust loan amount, interest rate, term, and down payment to see how different options affect their monthly payment and total cost over the life of the loan.

---

## Requirements

### Functional Requirements

1. **Comparison Slots (2-3 scenarios)**
   - Allow comparing 2 scenarios by default
   - Option to add a 3rd scenario
   - Each scenario is independently configurable

2. **Input Fields Per Scenario**
   - Loan amount (or purchase price + down payment)
   - Interest rate (manual entry or select from presets)
   - Loan term (15, 20, or 30 years)
   - Down payment (amount or percentage)
   - Loan type label (e.g., "Conventional 30yr", "FHA 15yr")

3. **Calculated Outputs Per Scenario**
   - Monthly P&I payment
   - Monthly payment with taxes/insurance estimate
   - Total of all payments over loan life
   - Total interest paid
   - Loan-to-value ratio

4. **Comparison Highlights**
   - Highlight lowest monthly payment (green)
   - Highlight lowest total cost (green)
   - Show difference from cheapest option

5. **Preset Scenarios**
   - "Quick Compare" buttons:
     - "15yr vs 30yr" - same loan, different terms
     - "5% vs 20% down" - compare PMI impact
     - "Conv vs FHA" - compare loan types

6. **No Authentication Required**
   - Public tool for lead generation
   - Optional "Save Comparison" (stores in localStorage)

### Non-Functional Requirements

- Real-time updates as inputs change
- Responsive design (stack vertically on mobile)
- Print-friendly layout
- Clear visual comparison (table or cards)

---

## Acceptance Criteria

- [ ] Page accessible at `/compare` without authentication
- [ ] Can compare 2 scenarios by default
- [ ] Can add 3rd scenario
- [ ] All calculations update in real-time
- [ ] Monthly payment calculated correctly
- [ ] Total interest calculated correctly
- [ ] Lowest values highlighted in green
- [ ] Differences shown relative to best option
- [ ] Preset scenarios populate correctly
- [ ] Mobile responsive (stacked layout)
- [ ] Can clear/reset all scenarios

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/compare.tsx` | Main comparison page |
| `src/lib/loan-calculator.ts` | Loan calculation functions |
| `src/components/LoanScenarioCard.tsx` | Individual scenario input/output card |
| `src/__tests__/loan-calculator.test.ts` | Unit tests for calculations |

## Files to Modify

| File | Change |
|------|--------|
| None required | Standalone feature |

---

## Technical Notes

### Calculation Formulas

```typescript
// Monthly Payment (P&I)
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 12
  const numPayments = termYears * 12

  if (monthlyRate === 0) return principal / numPayments

  return principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
}

// Total Interest
function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termYears: number
): number {
  return (monthlyPayment * termYears * 12) - principal
}

// LTV
function calculateLTV(
  loanAmount: number,
  propertyValue: number
): number {
  return (loanAmount / propertyValue) * 100
}

// PMI estimate (if LTV > 80%)
function estimatePMI(loanAmount: number, ltv: number): number {
  if (ltv <= 80) return 0
  return (loanAmount * 0.005) / 12  // ~0.5% annual PMI
}
```

### Scenario Interface

```typescript
interface LoanScenario {
  id: string
  label: string
  purchasePrice: number
  downPayment: number
  loanAmount: number  // calculated
  interestRate: number
  termYears: number
  // Calculated outputs
  monthlyPI: number
  monthlyTotal: number  // with taxes/insurance/PMI
  totalPayments: number
  totalInterest: number
  ltv: number
}
```

### Preset Configurations

```typescript
const PRESETS = {
  '15vs30': {
    scenarios: [
      { label: '30-Year Fixed', termYears: 30, rate: 0.0675 },
      { label: '15-Year Fixed', termYears: 15, rate: 0.0625 }
    ]
  },
  'downPayment': {
    scenarios: [
      { label: '5% Down', downPaymentPct: 0.05 },
      { label: '20% Down', downPaymentPct: 0.20 }
    ]
  },
  'convVsFha': {
    scenarios: [
      { label: 'Conventional', rate: 0.0675, downPaymentPct: 0.05 },
      { label: 'FHA', rate: 0.065, downPaymentPct: 0.035 }
    ]
  }
}
```

### Styling Notes

- Use consistent card widths for comparison
- Align numbers to right for easy scanning
- Use green for "best" values, gray for others
- Show "+$X" difference labels in red/orange

---

## Testing

### Unit Tests (Required)

```typescript
// src/__tests__/loan-calculator.test.ts
describe('Loan Calculator', () => {
  describe('calculateMonthlyPayment', () => {
    test('calculates 30yr $300k at 6.5%', () => {
      const payment = calculateMonthlyPayment(300000, 0.065, 30)
      expect(payment).toBeCloseTo(1896.20, 0)
    })

    test('calculates 15yr $300k at 6.0%', () => {
      const payment = calculateMonthlyPayment(300000, 0.06, 15)
      expect(payment).toBeCloseTo(2531.57, 0)
    })

    test('handles 0% interest rate', () => {
      const payment = calculateMonthlyPayment(300000, 0, 30)
      expect(payment).toBeCloseTo(833.33, 0)
    })
  })

  describe('calculateTotalInterest', () => {
    test('calculates total interest correctly')
  })

  describe('calculateLTV', () => {
    test('calculates LTV correctly')
    test('returns 80 for 20% down')
  })

  describe('estimatePMI', () => {
    test('returns 0 when LTV <= 80')
    test('returns PMI estimate when LTV > 80')
  })
})
```

### Manual Testing
1. Navigate to /compare
2. Enter $400k purchase, $80k down, 6.5%, 30yr in slot 1
3. Change slot 2 to 15yr, verify higher payment but lower total interest
4. Test "15yr vs 30yr" preset
5. Add 3rd scenario, verify all three compare correctly
6. Test on mobile device

---

## Design Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  Compare Loan Options                                            │
│  See how different scenarios affect your costs                   │
├─────────────────────────────────────────────────────────────────┤
│  Quick Compare: [15yr vs 30yr] [5% vs 20% Down] [Conv vs FHA]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐   │
│  │ SCENARIO 1      │  │ SCENARIO 2      │  │ + Add Option  │   │
│  │ ─────────────── │  │ ─────────────── │  │               │   │
│  │ Label:          │  │ Label:          │  │               │   │
│  │ [30-Year Fixed] │  │ [15-Year Fixed] │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Purchase Price  │  │ Purchase Price  │  │               │   │
│  │ [$400,000     ] │  │ [$400,000     ] │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Down Payment    │  │ Down Payment    │  │               │   │
│  │ [$80,000      ] │  │ [$80,000      ] │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Interest Rate   │  │ Interest Rate   │  │               │   │
│  │ [6.75%        ] │  │ [6.25%        ] │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Term            │  │ Term            │  │               │   │
│  │ [30 years  ▼]   │  │ [15 years  ▼]   │  │               │   │
│  ├─────────────────┤  ├─────────────────┤  │               │   │
│  │ RESULTS         │  │ RESULTS         │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Monthly P&I     │  │ Monthly P&I     │  │               │   │
│  │ $2,076 ✓ Best   │  │ $2,778 +$702    │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Total Interest  │  │ Total Interest  │  │               │   │
│  │ $427,359 +$179K │  │ $180,091 ✓ Best │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ Total Cost      │  │ Total Cost      │  │               │   │
│  │ $747,359        │  │ $500,091 ✓ Best │  │               │   │
│  │                 │  │                 │  │               │   │
│  │ LTV: 80%        │  │ LTV: 80%        │  │               │   │
│  └─────────────────┘  └─────────────────┘  └───────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
