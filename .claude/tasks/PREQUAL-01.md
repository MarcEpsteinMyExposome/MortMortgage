# PREQUAL-01: Pre-Qualification Calculator

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | PREQUAL-01 |
| **Title** | Pre-Qualification Calculator |
| **Status** | DONE |
| **Priority** | High |
| **Estimated Complexity** | Medium |
| **Dependencies** | None |

---

## Description

Create a `/prequalify` page with a quick pre-qualification calculator. Users can estimate their maximum loan amount and monthly payment without completing the full application. This helps borrowers understand their buying power before committing to the full URLA form.

---

## Requirements

### Functional Requirements

1. **Input Fields**
   - Annual gross income (required)
   - Monthly debt payments (credit cards, car loans, student loans, etc.)
   - Estimated credit score range (dropdown: Excellent 750+, Good 700-749, Fair 650-699, Below 650)
   - Down payment amount (required)
   - Desired loan term (15 or 30 years)
   - Property type (Single Family, Condo, Multi-unit)
   - Occupancy (Primary, Secondary, Investment)

2. **Output/Results**
   - Maximum loan amount (based on 43% DTI limit)
   - Estimated monthly payment (P&I)
   - Estimated interest rate (based on credit tier)
   - DTI ratio
   - Maximum purchase price (loan + down payment)

3. **Calculation Logic**
   - Use 43% DTI as max threshold for qualification
   - Rate tiers: Excellent 6.5%, Good 6.875%, Fair 7.25%, Below 7.75%
   - Include estimated taxes/insurance in payment (use 1.5% annual of home value)
   - Show warning if DTI > 36% (acceptable but higher risk)

4. **Call to Action**
   - "Start Full Application" button
   - Option to pre-fill application with entered data (store in sessionStorage)

5. **No Authentication Required**
   - Public page, anyone can use calculator
   - No data saved to database

### Non-Functional Requirements

- Real-time calculation as user types (debounced)
- Mobile-responsive layout
- Clear visual hierarchy (inputs left, results right on desktop)

---

## Acceptance Criteria

- [ ] Calculator accessible at `/prequalify` without authentication
- [ ] All input fields validate correctly (positive numbers, required fields)
- [ ] Results update in real-time as inputs change
- [ ] Maximum loan amount calculated correctly using 43% DTI
- [ ] Monthly payment calculated correctly (P&I + taxes/insurance estimate)
- [ ] Interest rate varies by credit score tier
- [ ] Warning displayed when DTI > 36%
- [ ] "Not qualified" message when DTI > 43% with entered debts
- [ ] "Start Full Application" navigates to /apply
- [ ] Pre-fill data persists to application if user continues

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/prequalify.tsx` | Main calculator page |
| `src/lib/prequalify.ts` | Calculation logic (pure functions) |
| `src/__tests__/prequalify.test.ts` | Unit tests for calculations |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/index.tsx` | Add "Get Pre-Qualified" button/link in hero section |

---

## Technical Notes

### Calculation Formulas

```typescript
// Maximum monthly housing payment (at 43% DTI)
maxHousingPayment = (annualIncome / 12) * 0.43 - monthlyDebts

// Monthly payment formula (P&I only)
// M = P * [r(1+r)^n] / [(1+r)^n - 1]
// where r = monthly rate, n = number of payments

// Estimate taxes + insurance at 1.5% annually of home value
// So actual P&I budget = maxHousingPayment - (estimatedHomeValue * 0.015 / 12)

// Work backwards to find max loan amount from payment
```

### Rate Tiers
```typescript
const RATE_TIERS = {
  'excellent': 0.065,  // 750+
  'good': 0.06875,     // 700-749
  'fair': 0.0725,      // 650-699
  'below': 0.0775      // <650
}
```

### Session Storage Key
```typescript
sessionStorage.setItem('prequalData', JSON.stringify({
  income: number,
  downPayment: number,
  creditTier: string,
  loanTerm: number
}))
```

### Styling
- Use card layout for results
- Green highlight for "You may qualify for up to..."
- Yellow warning for high DTI
- Red for not qualified

---

## Testing

### Unit Tests (Required)
```typescript
// src/__tests__/prequalify.test.ts
describe('Pre-qualification Calculator', () => {
  test('calculates max loan for excellent credit')
  test('calculates max loan for fair credit')
  test('returns not qualified when DTI exceeds 43%')
  test('calculates monthly payment correctly')
  test('includes tax/insurance estimate')
  test('shows warning for DTI between 36-43%')
})
```

### Manual Testing
1. Enter $100k income, $500 debts, excellent credit, $50k down, 30yr
2. Verify max loan ~$400k range
3. Test with high debts that push DTI > 43%
4. Test "Start Full Application" flow

---

## Design Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  Get Pre-Qualified in Minutes                                   │
│  See how much home you can afford                               │
├────────────────────────────┬────────────────────────────────────┤
│  YOUR INFORMATION          │  YOUR RESULTS                      │
│  ─────────────────────     │  ─────────────────────             │
│  Annual Income             │  ┌────────────────────────────┐   │
│  [$100,000        ]        │  │ You may qualify for up to  │   │
│                            │  │      $385,000              │   │
│  Monthly Debts             │  │   maximum loan amount      │   │
│  [$500            ]        │  └────────────────────────────┘   │
│                            │                                    │
│  Credit Score              │  Est. Monthly Payment: $2,450      │
│  [Excellent 750+  ▼]       │  Interest Rate: 6.50%              │
│                            │  Your DTI: 38%                     │
│  Down Payment              │  Max Purchase: $435,000            │
│  [$50,000         ]        │                                    │
│                            │  ⚠️ DTI is above 36%              │
│  Loan Term                 │                                    │
│  ○ 15 years  ● 30 years    │  ┌────────────────────────────┐   │
│                            │  │  [Start Full Application]  │   │
│  Property Type             │  └────────────────────────────┘   │
│  [Single Family   ▼]       │                                    │
└────────────────────────────┴────────────────────────────────────┘
```
