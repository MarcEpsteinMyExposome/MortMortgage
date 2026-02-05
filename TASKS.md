# MortMortgage — Tasks, Decisions & Restart Guide

## Project Decisions (recorded)
- **Standards**: URLA 2020 (target); MISMO v3.x (demo) with MISMO JSON + sample XML output and a filled URLA PDF sample.
- **Audience & Roles**: Primary users are **borrowers**; include **Admin** role for reviewer/demo staff. Multi-borrower (co-borrower) support required.
- **Platforms**: Web-first (Next.js) + native iOS later (out-of-scope for MVP).
- **Auth**: Borrowers & Admin: credential-based auth via NextAuth.js. Demo accounts provided.
- **Loan products**: **Conventional** first, then **FHA**.
- **Property types**: Support all residential types (SFR, condo, 2-4 units, multi-family).
- **Field depth**: **Full URLA** (Phase-by-phase approach; Phase A = core subset validated).
- **Integrations**: Stubbed/mocked for demo (credit bureau, ID, bank verification, AVM, pricing, eSign). Provide deterministic scenarios (good/avg/poor).
- **Documents**: Accept PDF/JPG/PNG, 10MB max. Document upload stubbed and tested with fake fixtures.
- **Tech stack**: Next.js (TypeScript), Tailwind CSS, Prisma 5.x (SQLite), NextAuth.js, Ajv for JSON Schema validation, Jest + React Testing Library, Cypress for E2E.
- **Hosting**: Optional Vercel deployment for demo (config in CI if desired).
- **Privacy**: US-only demo; use synthetic PII (do not store real SSNs).

---

## Related Documentation

| File | Purpose |
|------|---------|
| `TASKS.md` | Simple task list with status (this file) |
| `REQUIREMENTS.md` | Detailed task specifications and requirements |
| `SESSION.md` | Current session notes for continuity |

**To resume work**: Read all three files, then continue with the next priority task.

---

## Restart / Reproducibility Instructions

### Quick Start (new session)
```bash
# 1. Install dependencies
npm install

# 2. Initialize database (creates .env if missing, sets up SQLite)
npx prisma db push

# 3. Start dev server
npm run dev
```
App runs at http://localhost:3000

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Borrower | borrower@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

### Verify Everything Works
```bash
npm test              # Run all unit tests (149+ tests should pass)
npm run test:schemas  # Run schema validation tests
```

### Notes
- `.env` file should exist with `DATABASE_URL="file:./dev.db"`
- Prisma is pinned to v5.22.0 (v7+ has breaking changes)
- Tailwind CSS is pinned to v3.4.19 (v4 has breaking changes)
- SQLite stores JSON as strings — API handles serialization
- NextAuth.js handles authentication with JWT sessions
- `postcss.config.js` is required for Tailwind to work

---

## Task Status Summary

| ID | Task | Status |
|----|------|--------|
| DM-1 | Full URLA 2020 Schema | DONE |
| FE-01 | Multi-Step Wizard (10 steps) | DONE |
| BE-01 | Application CRUD API | DONE |
| DM-2 | MISMO v3.4 Export | DONE |
| ADMIN-01 | Admin Portal | DONE |
| FE-02 | Form Validation (DTI/LTV) | DONE |
| AUTH-01 | Authentication | DONE |
| DOC-01 | Document Upload | DONE |
| UI-01 | Front-End Design Refresh | DONE |
| INTEG-01 | Mock Integrations | DONE |
| PDF-01 | URLA PDF Export | DONE |
| ADMIN-UW-01 | Admin Underwriting Panel | DONE |
| TEST-02 | Unit Test Suite Expansion | DONE |
| DASH-01 | Borrower Dashboard | DONE |
| PREQUAL-01 | Pre-Qualification Calculator | DONE |
| ANALYTICS-01 | Admin Analytics Dashboard | DONE |
| COMPARE-01 | Loan Comparison Tool | DONE |
| UX-01 | Address Autocomplete (Google Places) | DONE |
| INTEG-02 | Plaid Integration (Bank/Income) | DONE |
| CO-BORROWER-02 | Co-Borrower UI | DONE |
| UX-02 | Wizard Stepper Fix + UX Polish | DONE |
| TEST-01 | E2E Tests (Cypress) | TBD - Future |

---

## Recently Completed Tasks (2026-02-05)

### UX-02: Wizard Stepper Fix + UX Polish Bundle

| Fix | Files |
|-----|-------|
| Stepper scroll arrows + auto-scroll | `ApplicationWizard.tsx` |
| Auto-save timestamp indicator | `ApplicationWizard.tsx` |
| "In Review" status in admin | `admin/index.tsx` |
| Plaid success toast | `PlaidLink.tsx` |
| Claude Code plugin documentation | `CONTRIBUTING.md` |

---

## Previously Completed (2026-02-03)

Four features implemented in parallel:

| ID | Task | Page | Files |
|----|------|------|-------|
| DASH-01 | Borrower Dashboard | `/dashboard` | `dashboard.tsx`, `ApplicationCard.tsx` |
| PREQUAL-01 | Pre-Qualification Calculator | `/prequalify` | `prequalify.tsx`, `lib/prequalify.ts` |
| ANALYTICS-01 | Admin Analytics Dashboard | `/admin/analytics` | `analytics.tsx`, `charts/`, API endpoint |
| COMPARE-01 | Loan Comparison Tool | `/compare` | `compare.tsx`, `lib/loan-calculator.ts` |

Task specs archived in `.claude/tasks/archive/` for reference.

---

## Completed Work

### Phase A (Data Model)
- URLA core JSON Schema created
- MISMO lite schema created
- Ajv validator and unit tests
- Seed fixtures

### Phase B (Full URLA) — Completed 2026-02-02
- **DM-1: Full URLA 2020 schema expansion**
  - 10 modular subschemas covering all URLA sections
  - All tests passing (`npm test` = 26 tests)

### Infrastructure Fixes — Completed 2026-02-02
- Fixed Next.js 13+ Link component syntax
- Fixed Prisma 7.x compatibility (pinned to 5.22.0)
- Fixed SQLite JSON storage (API serialization)
- Added SWR dependency
- Created .env file with DATABASE_URL
- Application create/save flow working

### FE-01: Multi-step URLA Form — Completed 2026-02-02
- [x] All 10 steps with complete field coverage
- [x] Auto-save on each step update
- [x] Progress indicator with validation status
- [x] Review page before submission
- [x] Confirmation page after submission

### BE-01: Application CRUD — Completed 2026-02-02
- [x] GET /api/apps/:id — fetch single app
- [x] PUT /api/apps/:id — update app data
- [x] DELETE /api/apps/:id — delete app
- [x] JSON serialization for SQLite compatibility

### DM-2: MISMO Mapping & Export — Completed 2026-02-02
- [x] URLA → MISMO v3.4 mapping function
- [x] Export validates against mismo-v3.json
- [x] JSON export endpoint
- [x] XML export with proper escaping
- [x] 13 unit tests for mapper

### ADMIN-01: Admin Portal — Completed 2026-02-02
- [x] List all applications with status filters
- [x] Stats dashboard (total, draft, submitted, approved, denied)
- [x] View application details (full data display)
- [x] Export as MISMO JSON/XML
- [x] Change application status
- [x] Delete applications

### FE-02: Form Validation — Completed 2026-02-02
- [x] Step-by-step validation with errors/warnings
- [x] DTI ratio warning (>43%)
- [x] LTV validation (max 97%, warning >80%)
- [x] Progress bar with completion tracking
- [x] Validation panel toggle

### AUTH-01: Authentication — Completed 2026-02-02
- [x] NextAuth.js with credentials provider
- [x] Demo accounts (borrower/admin)
- [x] JWT session strategy
- [x] Sign in page with demo account helpers
- [x] User menu component with sign out
- [x] Role-based UI (admin features hidden from borrowers)

### DOC-01: Document Upload — Completed 2026-02-02
- [x] File upload component (PDF, JPG, PNG, max 10MB)
- [x] Document type selection (W2, paystub, bank statement, etc.)
- [x] Store files locally in uploads directory
- [x] Documents step in wizard with required docs checklist
- [x] API endpoints for upload, list, view, delete

### UI-01: Front-End Design Refresh — Completed 2026-02-03
- [x] Custom Tailwind color palette (primary, success, warning, danger)
- [x] Inter font and modern typography
- [x] Component classes (btn, card, badge, alert, table, stat-card)
- [x] Home page redesign with hero section and features
- [x] Sign-in page with split layout branding
- [x] Admin portal with improved stats and table
- [x] ApplicationWizard with modern step indicator
- [x] Animations and transitions

### INTEG-01: Mock Integrations — Completed 2026-02-03
- [x] Credit pull simulation with deterministic scores (based on SSN pattern)
- [x] Income verification stub with employment validation
- [x] Property valuation (AVM) with comparables and market trends
- [x] Mock pricing engine with rate adjustments and scenarios
- [x] API endpoints for all integrations
- [x] Comprehensive type definitions

**Integration Files**:
- `src/lib/integrations/credit.ts` - Credit bureau simulation
- `src/lib/integrations/income.ts` - Income/employment verification
- `src/lib/integrations/avm.ts` - Automated property valuation
- `src/lib/integrations/pricing.ts` - Mortgage pricing engine
- `src/lib/integrations/index.ts` - Module exports and demo SSN patterns

**API Endpoints**:
- POST `/api/integrations/credit-pull` - Run credit check
- POST `/api/integrations/verify-income` - Verify employment/income
- POST `/api/integrations/property-value` - Get AVM valuation
- POST `/api/integrations/pricing` - Calculate loan pricing

### PDF-01: URLA PDF Export — Completed 2026-02-03
- [x] Generate PDF from application data using pdfmake
- [x] Structured layout matching URLA 1003 sections
- [x] Download from admin portal via "Export URLA PDF" button
- [x] SSN masking for security (shows only last 4 digits)

**PDF Files**:
- `src/lib/pdf-generator.ts` - PDF generation logic with section builders
- `src/pages/api/apps/[id]/pdf.ts` - API endpoint for PDF download

**API Endpoint**:
- GET `/api/apps/:id/pdf` - Download URLA PDF

---

## Completed Recent Tasks

### ADMIN-UW-01: Admin Underwriting Panel
**Status**: DONE
**Goal**: Add interactive underwriting section to admin app detail page
**Completed**:
- [x] Action buttons: Run Credit Pull, Verify Income, Get Appraisal, Get Pricing
- [x] Results display with risk badges (green/yellow/red)
- [x] Qualification summary card (credit score, DTI, LTV, payment)
- [x] Loading states with spinner animations

**Files created/modified:**
- `src/pages/admin/apps/[id].tsx` - Main UI changes
- `src/types/underwriting.ts` - Type definitions
- `src/lib/underwriting-utils.ts` - Risk calculations

### TEST-02: Unit Test Suite Expansion
**Status**: DONE
**Goal**: Comprehensive unit test coverage
**Completed**:
- [x] Form validation tests (45 tests)
- [x] Underwriting utilities tests (27 tests)
- [x] Integration tests (49 tests)
- [x] Total: 147 tests (up from 26)

**Files created:**
- `src/__tests__/form-validator.test.ts`
- `src/__tests__/underwriting-utils.test.ts`
- `src/__tests__/integrations.test.ts`

### DASH-01: Borrower Dashboard — Completed 2026-02-03
**Status**: DONE
**Goal**: Personal dashboard for borrowers to manage applications
**Completed**:
- [x] Application list with status badges
- [x] Status summary cards (Total, Draft, Submitted, etc.)
- [x] Continue/View actions for applications
- [x] Empty state with CTA

**Files created:**
- `src/pages/dashboard.tsx`
- `src/components/ApplicationCard.tsx`

### PREQUAL-01: Pre-Qualification Calculator — Completed 2026-02-03
**Status**: DONE
**Goal**: Quick affordability calculator for borrowers
**Completed**:
- [x] Input fields (income, debts, credit tier, down payment, term)
- [x] Real-time max loan calculation (43% DTI)
- [x] Monthly payment with taxes/insurance estimate
- [x] Session storage for application pre-fill

**Files created:**
- `src/pages/prequalify.tsx`
- `src/lib/prequalify.ts`
- `src/__tests__/prequalify.test.ts`

### ANALYTICS-01: Admin Analytics Dashboard — Completed 2026-02-03
**Status**: DONE
**Goal**: Charts and metrics for administrators
**Completed**:
- [x] Summary metrics (total, this month, approval rate, avg loan)
- [x] Volume chart (applications over time)
- [x] Status pie chart
- [x] Loan type breakdown
- [x] Recent activity feed

**Files created:**
- `src/pages/admin/analytics.tsx`
- `src/pages/api/admin/analytics.ts`
- `src/components/charts/StatusPieChart.tsx`
- `src/components/charts/VolumeChart.tsx`

### COMPARE-01: Loan Comparison Tool — Completed 2026-02-03
**Status**: DONE
**Goal**: Side-by-side loan scenario comparison
**Completed**:
- [x] 2-3 scenario comparison
- [x] Preset buttons (15yr vs 30yr, 5% vs 20% down, Conv vs FHA)
- [x] Monthly payment, total interest, LTV calculations
- [x] Best value highlighting (green)

**Files created:**
- `src/pages/compare.tsx`
- `src/lib/loan-calculator.ts`
- `src/components/LoanScenarioCard.tsx`
- `src/__tests__/loan-calculator.test.ts`

### UX-01: Address Autocomplete — Completed 2026-02-04
**Status**: DONE
**Goal**: Google Places autocomplete for address fields
**Completed**:
- [x] Autocomplete dropdown with US address suggestions
- [x] Auto-fill street, city, state, zip on selection
- [x] Keyboard navigation (up/down/enter/escape)
- [x] Loading indicator while fetching
- [x] Graceful fallback to manual entry if no API key
- [x] Works on AddressForm (current residence)
- [x] Works on PropertyForm (subject property)
- [x] Mobile-friendly with proper ARIA attributes

**Files created:**
- `src/components/AddressAutocomplete.tsx` - Reusable autocomplete component
- `src/hooks/useDebounce.ts` - Debounce hook for API calls (300ms)
- `src/pages/api/places/autocomplete.ts` - Proxy API (hides API key)
- `src/pages/api/places/details.ts` - Place details for address parsing

**Files modified:**
- `src/components/steps/AddressForm.tsx` - Uses AddressAutocomplete
- `src/components/steps/PropertyForm.tsx` - Uses AddressAutocomplete
- `.env.example` - Added GOOGLE_PLACES_API_KEY template

**Setup:**
Add to `.env.local`:
```
GOOGLE_PLACES_API_KEY=your_api_key_here
```
Get API key at: https://console.cloud.google.com/apis/credentials
Enable: Places API, Geocoding API

### INTEG-02: Plaid Integration — Completed 2026-02-04
**Status**: DONE
**Goal**: Bank account linking and income verification via Plaid
**Completed**:
- [x] Plaid Link integration with "Connect Bank Account" button
- [x] Bank account display (masked numbers, institution name, balances)
- [x] Income verification with verified annual/monthly income
- [x] Sandbox mode with test credentials (user_good / pass_good)
- [x] Demo mode fallback when Plaid is not configured
- [x] Manual entry fallback with toggle
- [x] Loading states and error handling
- [x] Auto-populate monthly income from verified data

**Files created:**
- `src/lib/integrations/plaid.ts` - Plaid client and helpers
- `src/pages/api/plaid/create-link-token.ts` - API to create link token
- `src/pages/api/plaid/exchange-token.ts` - API to exchange public token
- `src/pages/api/plaid/get-accounts.ts` - API to fetch/disconnect accounts
- `src/components/PlaidLink.tsx` - Plaid Link button and account display components

**Files modified:**
- `src/components/steps/EmploymentForm.tsx` - Added Plaid connect option
- `package.json` - Added `plaid` and `react-plaid-link` dependencies
- `.env.example` - Added Plaid env vars template

**Setup:**
Add to `.env.local`:
```
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox
```
Get credentials at: https://dashboard.plaid.com/signup (free)

**Sandbox Test Credentials:**
- Username: `user_good`
- Password: `pass_good`
- MFA code: `1234`

---

## Recently Completed (2026-02-05)

### INTEG-04: AI Document Intelligence — DONE
**Status**: DONE
**Priority**: High
**Complexity**: High
**Goal**: AI-powered OCR and data extraction from mortgage documents

**Completed Features**:
- [x] Claude API extractor with vision capability
- [x] Tesseract.js fallback (works offline, no API key needed)
- [x] Mock provider for demos
- [x] Extraction prompts for W2, paystubs, bank statements
- [x] Field parsers and normalizers (currency, dates, SSN masking)
- [x] Confidence scoring with color-coded badges
- [x] Auto-fill suggestions when documents are processed
- [x] Admin panel with Document Intelligence section
- [x] Comparison view (OCR vs borrower-entered data)
- [x] Fraud risk flagging for discrepancies

**Files Created**:
- `src/lib/ocr/types.ts` - TypeScript types
- `src/lib/ocr/index.ts` - OCR orchestrator
- `src/lib/ocr/claude-extractor.ts` - Claude API integration
- `src/lib/ocr/tesseract-extractor.ts` - Tesseract.js fallback
- `src/lib/ocr/extraction-prompts.ts` - Document-specific prompts
- `src/lib/ocr/field-parsers.ts` - Field normalization
- `src/lib/ocr/text-patterns.ts` - Regex patterns for Tesseract
- `src/pages/api/documents/[docId]/process.ts` - Process OCR endpoint
- `src/pages/api/documents/[docId]/extraction.ts` - Get results endpoint
- `src/pages/api/documents/[docId]/retry-ocr.ts` - Retry endpoint
- `src/pages/api/apps/[id]/process-documents.ts` - Batch process
- `src/components/ExtractionStatus.tsx` - Status indicator
- `src/components/ExtractionResults.tsx` - Results display
- `src/components/DataComparisonPanel.tsx` - Comparison view
- `src/components/AutoFillSuggestion.tsx` - Auto-fill banner
- `src/components/ai/*` - AI components for DocumentsStep

**Setup**:
```bash
# Add to .env.local for Claude extraction:
ANTHROPIC_API_KEY=sk-ant-...

# Or use without API key - Tesseract fallback will be used
```

**Test Fixtures** (in `src/fixtures/documents/`):
- `sample-w2.png` - Synthetic W-2 with known values
- `sample-paystub.png` - Synthetic paystub
- `sample-bank-statement.png` - Synthetic bank statement
- `expected-values.json` - Expected OCR extraction values
- Regenerate with: `npm run generate:docs`

---

### INTEG-05: SignaturePad Component — DONE
**Status**: DONE (Minimal Scope)
**Priority**: Medium
**Complexity**: Low
**Goal**: Reusable signature capture component

**Completed Features**:
- [x] SignaturePad component with touch support
- [x] pdf-signer utility to embed signatures in PDFs
- [x] Clear/save functionality
- [x] Responsive canvas sizing
- [x] 20 unit tests

**Files Created**:
- `src/components/SignaturePad.tsx` - Signature capture component
- `src/lib/signing/pdf-signer.ts` - PDF signature embedding utility
- `src/__tests__/signature-pad.test.ts` - Tests

**Usage**:
```tsx
import SignaturePad from '@/components/SignaturePad';

<SignaturePad
  onSave={(base64Png) => console.log('Signature:', base64Png)}
  onCancel={() => setShowPad(false)}
/>
```

---

## Future Ideas (Backlog)

### IDEA-01: Borrower Status Tracker ("Pizza Tracker")
**Inspiration**: Domino's Pizza Tracker, Uber ride status
**Goal**: Real-time application status visibility
**Would include**:
- Visual pipeline: Applied → Processing → Underwriting → Clear to Close
- Push notifications for status changes
- In-app secure messaging with loan officer
- Document request portal with upload buttons
- Closing countdown with checklist

**Impact**: High (80%+ of borrower complaints are about communication)

---

### IDEA-02: What-If Scenario Planner
**Inspiration**: NerdWallet, Bankrate calculators
**Goal**: Advanced loan exploration beyond current Compare tool
**Would include**:
- Slider-based exploration (price/down payment/rate)
- Break-even analysis for rate buydowns
- Rent vs Buy calculator
- Affordability by location comparison
- Future refinance estimator

**Impact**: Medium (engagement driver, trusted advisor positioning)

---

### IDEA-03: Instant Pre-Approval Engine
**Inspiration**: Better.com's 1-day AI approval
**Goal**: Simulate real underwriting for instant decisions
**Would include**:
- Simulate DU/LP findings
- Generate conditional approval letter PDF
- Rate lock simulation with pricing impact
- Approval confidence score

**Impact**: Very High (major competitive differentiator)
**Complexity**: Very High (requires deep integration work)

---

### TEST-01: E2E Tests (Cypress)
**Status**: TBD - Future
**Goal**: Cypress E2E test suite (requires browser automation)
**Would include**:
- Complete application flow test
- Admin portal test
- Export functionality test (including PDF)

---

### INTEG-03: eSign Integration (DocuSign) — SUPERSEDED
**Status**: Superseded by INTEG-05
**Note**: Original DocuSign approach replaced with simpler DIY solution.
**Task Spec**: `.claude/tasks/INTEG-03.md` (archived reference)

### CO-BORROWER-02: Co-Borrower UI — Completed 2026-02-04
**Status**: DONE
**Goal**: Add co-borrower support to mortgage application wizard
**Completed**:
- [x] BorrowerTabs component for switching between Primary/Co-Borrower
- [x] "Add Co-Borrower" toggle on Identity step
- [x] Tab-based UI for Identity, Address, Employment steps
- [x] Form state resets when switching between borrowers
- [x] Validation for both borrowers before proceeding
- [x] Admin detail page shows co-borrower information
- [x] PDF export already supports multiple borrowers (via buildBorrowerSection)
- [x] Remove co-borrower functionality

**Files created:**
- `src/components/BorrowerTabs.tsx` - Reusable tabs component with validation indicators

**Files modified:**
- `src/components/ApplicationWizard.tsx` - Added hasCoBorrower and activeBorrowerIndex state
- `src/components/steps/IdentityStep.tsx` - Added toggle and tabs support
- `src/components/steps/AddressForm.tsx` - Added tabs support
- `src/components/steps/EmploymentForm.tsx` - Added tabs support
- `src/pages/admin/apps/[id].tsx` - Display co-borrower details
- `src/lib/form-validator.ts` - Validate both borrowers when co-borrower exists

---

## Files & Contracts (source of truth)

### JSON Schemas (Full URLA 2020)
| File | Description |
|------|-------------|
| `src/schemas/urla-full.json` | Main schema with all section refs |
| `src/schemas/urla-borrower.json` | Section 1: Borrower (addresses, employment, military) |
| `src/schemas/urla-loan.json` | Section 4a: Loan (purpose, type, terms, down payment) |
| `src/schemas/urla-property.json` | Section 4b: Property (address, occupancy, title) |
| `src/schemas/urla-income.json` | Income sources |
| `src/schemas/urla-assets.json` | Section 2a: Assets |
| `src/schemas/urla-liabilities.json` | Section 2b: Liabilities |
| `src/schemas/urla-real-estate.json` | Section 3: Real estate owned |
| `src/schemas/urla-declarations.json` | Section 5: Declarations (15 questions) |
| `src/schemas/urla-demographics.json` | Section 8: HMDA demographics |
| `src/schemas/mismo-v3.json` | MISMO v3.4 export schema |

### Form Step Components
| File | Description |
|------|-------------|
| `src/components/ApplicationWizard.tsx` | Main wizard controller with validation |
| `src/components/steps/IdentityStep.tsx` | Step 1: Borrower name, SSN, DOB, citizenship |
| `src/components/steps/AddressForm.tsx` | Step 2: Current address & housing info |
| `src/components/steps/EmploymentForm.tsx` | Step 3: Employment history & income |
| `src/components/steps/AssetsForm.tsx` | Step 4: Bank accounts, investments |
| `src/components/steps/LiabilitiesForm.tsx` | Step 5: Debts, loans, credit cards |
| `src/components/steps/PropertyForm.tsx` | Step 6: Subject property details |
| `src/components/steps/LoanForm.tsx` | Step 7: Loan purpose, amount, terms |
| `src/components/steps/DeclarationsForm.tsx` | Step 8: 15 URLA declaration questions |
| `src/components/steps/DemographicsForm.tsx` | Step 9: HMDA demographics (optional) |
| `src/components/steps/DocumentsStep.tsx` | Step 10: Document upload |

### API Endpoints
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/apps` | GET, POST | List all / create new application |
| `/api/apps/[id]` | GET, PUT, DELETE | Fetch, update, delete single application |
| `/api/apps/[id]/export` | GET | Export to MISMO JSON or XML |
| `/api/apps/[id]/documents` | GET, POST | List / upload documents |
| `/api/apps/[id]/documents/[docId]` | GET, DELETE | View / delete document |
| `/api/auth/[...nextauth]` | * | NextAuth.js authentication |

### Key Library Files
| File | Description |
|------|-------------|
| `src/lib/validator.ts` | Ajv schema validator functions |
| `src/lib/mismo-mapper.ts` | URLA to MISMO v3.4 mapping & XML export |
| `src/lib/form-validator.ts` | Form step validation with DTI/LTV checks |
| `src/lib/auth.ts` | Auth helpers and middleware |

### Styling Files
| File | Description |
|------|-------------|
| `tailwind.config.js` | Custom colors, shadows, animations |
| `src/styles/globals.css` | Component classes (btn, card, badge, etc.) |

### Other Key Files
- `src/schemas/urla-core.json` — Phase A simplified schema
- `src/fixtures/*.json` — Test fixtures (good, average, poor, co-borrower)
- `prisma/schema.prisma` — Database schema
- `REQUIREMENTS.md` — Detailed task specifications
- `SESSION.md` — Current session notes

---

## How to Resume Work with Claude

### Starting a New Session
```
Read TASKS.md, REQUIREMENTS.md, and SESSION.md then continue with [TASK-ID]
```

### Recommended Prompts
- "Read the docs and continue with INTEG-01 (mock integrations)"
- "Implement URLA PDF export (PDF-01)"
- "Add co-borrower support to the wizard"
- "Run the tests and fix any failures"
- "Check SESSION.md for current progress"

### If Something Breaks
- "Run `npm test` and show me the errors"
- "Check the browser console for errors"
- "Read src/pages/api/apps/index.ts and fix the issue"

---

## Decision Log
- 2026-02-02: Completed DM-1 (full URLA schema expansion)
- 2026-02-02: Fixed infrastructure issues (Prisma, Next.js Link, SQLite JSON)
- 2026-02-02: Application create flow working end-to-end
- 2026-02-02: Completed FE-01 (10-step multi-step wizard with all URLA sections)
- 2026-02-02: Completed BE-01 (full CRUD API for applications)
- 2026-02-02: Completed DM-2 (MISMO v3.4 mapping and JSON/XML export)
- 2026-02-02: Completed ADMIN-01 (admin portal with details, export, status management)
- 2026-02-02: Completed FE-02 (form validation with DTI/LTV checks)
- 2026-02-02: Completed AUTH-01 (NextAuth.js authentication with demo accounts)
- 2026-02-02: Completed DOC-01 (document upload with file storage and wizard step)
- 2026-02-03: Completed UI-01 (front-end design refresh with modern styling)
- 2026-02-03: Created documentation system (REQUIREMENTS.md, SESSION.md)
- 2026-02-03: Completed INTEG-01 (mock integrations for credit, income, AVM, pricing)
- 2026-02-03: Fixed bug - login redirect to wrong port (extracted pathname from NextAuth URL)
- 2026-02-03: Fixed bug - oversized icons (added postcss.config.js, downgraded Tailwind to v3)
- 2026-02-03: Fixed bug - employment.find crash (added Array.isArray checks in form-validator)
- 2026-02-03: Fixed CSS import order (moved @import before @tailwind directives)
- 2026-02-03: Completed DASH-01 (borrower dashboard with application list)
- 2026-02-03: Completed PREQUAL-01 (pre-qualification calculator)
- 2026-02-03: Completed ANALYTICS-01 (admin analytics with charts)
- 2026-02-03: Completed COMPARE-01 (loan comparison tool)
- 2026-02-03: Fixed sign-out redirect bug (uses window.location.origin)
- 2026-02-03: Created CLAUDE.md as project entry point
- 2026-02-04: Completed UX-01 (address autocomplete with Google Places API)

---

## Bug Fixes (2026-02-05)

### OCR Extraction Results Displaying Character-by-Character
- **Problem**: Document extraction showed 612 individual characters instead of parsed fields
- **Root Cause**: Documents API returned JSON strings from SQLite without parsing them
- **Fix**: Added JSON.parse() for extractedData, extractedFields, fieldConfidences in documents listing endpoint
- **File**: `src/pages/api/apps/[id]/documents/index.ts`

---

## Bug Fixes (2026-02-03)

### Login Redirect to Wrong Port
- **Problem**: After signin, NextAuth redirected to localhost:3000 even when app ran on different port
- **Fix**: Modified signin handler to extract pathname only from NextAuth result URL
- **File**: `src/pages/auth/signin.tsx`

### Oversized Icons / Tailwind Not Loading
- **Problem**: SVG icons rendered at massive sizes because Tailwind CSS wasn't processing
- **Root Cause**: Missing `postcss.config.js` + Tailwind v4 incompatibility
- **Fix**: Created `postcss.config.js`, downgraded Tailwind to v3.4.19
- **Files**: `postcss.config.js` (new), `package.json`

### Form Validator Crash (employment.find)
- **Problem**: Validator crashed when employment/assets/liabilities were objects instead of arrays
- **Fix**: Added `Array.isArray()` checks before calling array methods
- **File**: `src/lib/form-validator.ts`

### CSS Import Order Error
- **Problem**: Build failed because @import was after @tailwind directives
- **Fix**: Moved font @import to top of globals.css
- **File**: `src/styles/globals.css`

---

## Test Coverage
- **149+ unit tests** covering:
  - Schema validation (URLA core, full, extended)
  - MISMO mapper (mapping, validation, XML generation)
  - React component testing (IdentityForm)
  - Form validation (all wizard steps, DTI/LTV checks)
  - Underwriting utilities (risk badges, qualification logic)
  - Mock integrations (credit, income, pricing calculations)

---

## Contact & Notes
- All demo data must remain synthetic
- Tests: `npm test` (299 unit tests, excludes OCR integration)
- OCR Tests: `npm run test:ocr` (integration tests with real images)
- Database: SQLite at `prisma/dev.db`
- Auth: NextAuth.js with JWT sessions
- **Important**: Stop dev server before running `npx prisma generate` on Windows
