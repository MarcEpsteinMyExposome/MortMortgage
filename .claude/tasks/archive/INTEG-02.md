# INTEG-02: Plaid Integration (Income/Bank Verification)

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | INTEG-02 |
| **Title** | Plaid Integration |
| **Status** | DONE |
| **Priority** | Medium |
| **Estimated Complexity** | Medium |
| **Dependencies** | None |

---

## Description

Integrate Plaid for real bank account linking and income verification. Plaid provides a free Sandbox environment with test credentials. This replaces/supplements the mock income verification with a real "Connect your bank" flow.

---

## Requirements

### Functional Requirements

1. **Plaid Link Integration**
   - Add "Connect Bank Account" button in Employment/Income step
   - Open Plaid Link modal for bank selection
   - Handle success/error callbacks

2. **Income Verification**
   - Use Plaid's Income product (or Assets as fallback)
   - Display verified income from connected accounts
   - Show verification status badge

3. **Bank Account Display**
   - Show connected accounts (masked account numbers)
   - Display institution name and logo
   - Option to disconnect/reconnect

4. **Sandbox Mode**
   - Use Plaid Sandbox environment
   - Test credentials work without real bank login
   - Deterministic test data for demos

5. **Fallback to Manual**
   - Keep manual income entry as fallback
   - "Skip bank connection" option
   - Works if Plaid unavailable

### Non-Functional Requirements

- Secure token handling (never expose secrets client-side)
- Loading states during Plaid operations
- Error handling with user-friendly messages

---

## Acceptance Criteria

- [x] "Connect Bank" button appears in wizard
- [x] Plaid Link modal opens successfully
- [x] Can connect using Sandbox test credentials
- [x] Connected accounts display correctly
- [x] Income data populates from Plaid
- [x] Can skip Plaid and enter manually
- [x] Works in demo without real bank credentials

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/integrations/plaid.ts` | Plaid client and helpers |
| `src/pages/api/plaid/create-link-token.ts` | API to create link token |
| `src/pages/api/plaid/exchange-token.ts` | API to exchange public token |
| `src/pages/api/plaid/get-accounts.ts` | API to fetch account data |
| `src/components/PlaidLink.tsx` | Plaid Link button component |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/steps/EmploymentForm.tsx` | Add Plaid connect option |
| `package.json` | Add `react-plaid-link` dependency |
| `.env.example` | Add Plaid env vars template |

---

## Technical Notes

### Plaid Sandbox Credentials
```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
```

Free sandbox at: https://dashboard.plaid.com/signup

### Dependencies
```bash
npm install plaid react-plaid-link
```

### API Flow
```
1. Client requests link_token from /api/plaid/create-link-token
2. Client opens Plaid Link with link_token
3. User connects bank (sandbox: use test credentials)
4. Plaid returns public_token to client
5. Client sends public_token to /api/plaid/exchange-token
6. Server exchanges for access_token, stores it
7. Server fetches account/income data
8. Client displays verified income
```

### Server-Side Token Creation
```typescript
// pages/api/plaid/create-link-token.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
)

export default async function handler(req, res) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: req.body.userId },
    client_name: 'MortMortgage',
    products: ['auth', 'income_verification'],
    country_codes: ['US'],
    language: 'en',
  })
  res.json({ link_token: response.data.link_token })
}
```

### Client-Side Plaid Link
```tsx
import { usePlaidLink } from 'react-plaid-link'

function PlaidLinkButton({ linkToken, onSuccess }) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      onSuccess(public_token, metadata)
    },
  })

  return (
    <button onClick={() => open()} disabled={!ready} className="btn btn-primary">
      Connect Bank Account
    </button>
  )
}
```

### Sandbox Test Credentials
When Plaid Link opens in sandbox:
- Username: `user_good`
- Password: `pass_good`
- Any code for MFA: `1234`

---

## Testing

### Manual Testing
1. Click "Connect Bank Account"
2. Plaid Link modal opens
3. Search for "Chase" or any bank
4. Use sandbox credentials (user_good / pass_good)
5. Complete connection
6. Verify accounts display
7. Verify income data populates

### Sandbox Test Scenarios
- `user_good` - Successful connection
- `user_error` - Error scenario
- Different institutions have different test data

---

## Design Reference

```
┌─────────────────────────────────────────────────────────┐
│  Step 4: Employment & Income                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏦 Verify Income Instantly                      │   │
│  │                                                  │   │
│  │  Connect your bank to automatically verify      │   │
│  │  your income and employment.                    │   │
│  │                                                  │   │
│  │  [Connect Bank Account]                         │   │
│  │                                                  │   │
│  │  ── or enter manually below ──                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Connected Accounts:                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏦 Chase Bank           ✓ Verified              │   │
│  │    Checking ****1234    $5,432.10               │   │
│  │    Savings  ****5678    $12,000.00              │   │
│  │                                   [Disconnect]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Verified Annual Income: $85,000                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Setup

Add to `.env.local`:
```
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox
```

Get credentials at: https://dashboard.plaid.com/signup (free)
