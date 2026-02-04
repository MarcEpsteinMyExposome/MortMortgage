# CO-BORROWER-02: Co-Borrower UI

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | CO-BORROWER-02 |
| **Title** | Co-Borrower UI |
| **Status** | DONE |
| **Priority** | High |
| **Estimated Complexity** | Medium |
| **Dependencies** | None (schema already supports co-borrowers) |
| **Completed** | 2026-02-04 |

---

## Description

Add UI support for co-borrowers in the mortgage application wizard. The schema already supports multiple borrowers with `borrowerType: "borrower" | "co_borrower"`. Forms already accept `borrowerIndex` prop. Need to add toggle and duplicate borrower sections.

---

## Requirements

### Functional Requirements

1. **Add Co-Borrower Toggle**
   - Add "Add Co-Borrower" button/toggle on Identity step
   - When enabled, show co-borrower indicator throughout wizard
   - Allow removing co-borrower at any time

2. **Duplicate Borrower Steps for Co-Borrower**
   - Identity step: primary + co-borrower
   - Address step: primary + co-borrower
   - Employment step: primary + co-borrower
   - Other borrower-specific fields

3. **Wizard Flow Options** (choose one):
   - Option A: Add separate steps (Step 1a: Primary Identity, Step 1b: Co-Borrower Identity)
   - Option B: Tab within each step (Primary | Co-Borrower tabs)
   - **Recommended: Option B** - cleaner UX

4. **Data Structure**
   ```typescript
   data.borrowers = [
     { borrowerType: 'borrower', name: {...}, ... },
     { borrowerType: 'co_borrower', name: {...}, ... }
   ]
   ```

5. **Validation**
   - Validate both borrowers when co-borrower enabled
   - Show validation status for each borrower

6. **Admin View**
   - Display co-borrower info in admin app detail
   - PDF export should include co-borrower

### Non-Functional Requirements

- Preserve existing single-borrower flow (default)
- Don't break existing applications
- Mobile responsive tabs/toggle

---

## Acceptance Criteria

- [x] "Add Co-Borrower" toggle on identity step
- [x] Co-borrower fields appear when enabled
- [x] Both borrowers saved to database correctly
- [x] Validation works for both borrowers
- [x] Can remove co-borrower
- [x] Admin view shows co-borrower details
- [x] Existing single-borrower apps still work

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/steps/IdentityStep.tsx` | Add co-borrower toggle, tabs |
| `src/components/steps/AddressForm.tsx` | Support borrower tabs |
| `src/components/steps/EmploymentForm.tsx` | Support borrower tabs |
| `src/components/ApplicationWizard.tsx` | Track hasCoBorrower state |
| `src/pages/admin/apps/[id].tsx` | Display co-borrower info |
| `src/lib/pdf-generator.ts` | Include co-borrower in PDF |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/BorrowerTabs.tsx` | Reusable tabs component for switching borrowers |

---

## Technical Notes

### Existing Schema Support
The schema already defines:
```json
"borrowerType": {
  "type": "string",
  "enum": ["borrower", "co_borrower"]
}
```

### Existing Form Support
Forms already receive `borrowerIndex` prop:
```typescript
export default function AddressForm({ data, borrowerIndex, onUpdate, ... }: StepProps)
```

### State Management
```typescript
// In ApplicationWizard or step
const [hasCoBorrower, setHasCoBorrower] = useState(
  data.borrowers?.length > 1
)
const [activeBorrowerIndex, setActiveBorrowerIndex] = useState(0)
```

### Tab UI Pattern
```tsx
<div className="flex border-b mb-4">
  <button
    className={`px-4 py-2 ${activeBorrowerIndex === 0 ? 'border-b-2 border-primary-500' : ''}`}
    onClick={() => setActiveBorrowerIndex(0)}
  >
    Primary Borrower
  </button>
  {hasCoBorrower && (
    <button
      className={`px-4 py-2 ${activeBorrowerIndex === 1 ? 'border-b-2 border-primary-500' : ''}`}
      onClick={() => setActiveBorrowerIndex(1)}
    >
      Co-Borrower
    </button>
  )}
</div>
```

---

## Testing

### Manual Testing
1. Start new application
2. Enable "Add Co-Borrower"
3. Fill both borrower sections
4. Verify both save correctly
5. Check admin view shows both
6. Export PDF, verify both included
7. Test removing co-borrower

---

## Design Reference

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Borrower Identity                              │
├─────────────────────────────────────────────────────────┤
│  [x] Add Co-Borrower                                    │
│                                                         │
│  [ Primary Borrower ] [ Co-Borrower ]  ← Tabs          │
│  ─────────────────────────────────────                  │
│                                                         │
│  First Name: [John          ]                           │
│  Last Name:  [Smith         ]                           │
│  SSN:        [***-**-1234   ]                           │
│  DOB:        [01/15/1985    ]                           │
│                                                         │
│                              [Back] [Save & Continue]   │
└─────────────────────────────────────────────────────────┘
```
