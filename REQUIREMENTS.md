# MortMortgage — Requirements & Task Details

This document provides detailed requirements for each task in the project. Use this alongside `TASKS.md` (simple task list) and `SESSION.md` (current session notes) to understand and continue work.

---

## Completed Tasks

### DM-1: Full URLA 2020 Schema Expansion
**Status**: Completed
**Priority**: High

**Description**: Expand the URLA JSON schemas to cover all sections of the URLA 2020 form.

**Requirements**:
- Create modular subschemas for each URLA section
- Section 1: Borrower Information (name, SSN, DOB, citizenship, addresses, employment)
- Section 2a: Assets and Other Credits
- Section 2b: Liabilities
- Section 3: Real Estate Owned
- Section 4a: Loan and Property Information
- Section 4b: Property Details
- Section 5: Declarations (15 questions)
- Section 8: HMDA Demographics (optional)
- All schemas must validate with Ajv

**Files Created**:
- `src/schemas/urla-borrower.json`
- `src/schemas/urla-assets.json`
- `src/schemas/urla-liabilities.json`
- `src/schemas/urla-real-estate.json`
- `src/schemas/urla-loan.json`
- `src/schemas/urla-property.json`
- `src/schemas/urla-declarations.json`
- `src/schemas/urla-demographics.json`
- `src/schemas/urla-income.json`
- `src/schemas/urla-full.json`

---

### FE-01: Multi-Step URLA Form Wizard
**Status**: Completed
**Priority**: High

**Description**: Build a 10-step wizard for the complete URLA form with auto-save and progress tracking.

**Requirements**:
- Step 1: Identity (name, SSN, DOB, citizenship, contact info)
- Step 2: Address (current address, housing status, previous addresses)
- Step 3: Employment (current employer, income, employment history)
- Step 4: Assets (bank accounts, investments, other assets)
- Step 5: Liabilities (credit cards, loans, other debts)
- Step 6: Property (subject property details, occupancy, title)
- Step 7: Loan (purpose, type, amount, terms, down payment)
- Step 8: Declarations (15 URLA declaration questions)
- Step 9: Demographics (HMDA info - optional)
- Step 10: Documents (upload supporting documents)
- Auto-save on each field change
- Progress indicator showing completion status
- Validation feedback per step

**Files Created**:
- `src/components/ApplicationWizard.tsx`
- `src/components/steps/IdentityStep.tsx`
- `src/components/steps/AddressForm.tsx`
- `src/components/steps/EmploymentForm.tsx`
- `src/components/steps/AssetsForm.tsx`
- `src/components/steps/LiabilitiesForm.tsx`
- `src/components/steps/PropertyForm.tsx`
- `src/components/steps/LoanForm.tsx`
- `src/components/steps/DeclarationsForm.tsx`
- `src/components/steps/DemographicsForm.tsx`
- `src/components/steps/DocumentsStep.tsx`

---

### BE-01: Application CRUD API
**Status**: Completed
**Priority**: High

**Description**: REST API endpoints for creating, reading, updating, and deleting mortgage applications.

**Requirements**:
- GET /api/apps - List all applications
- POST /api/apps - Create new application
- GET /api/apps/:id - Get single application
- PUT /api/apps/:id - Update application
- DELETE /api/apps/:id - Delete application
- Handle SQLite JSON serialization (store as strings, parse on read)

**Files Created**:
- `src/pages/api/apps/index.ts`
- `src/pages/api/apps/[id].ts`

---

### DM-2: MISMO v3.4 Mapping & Export
**Status**: Completed
**Priority**: High

**Description**: Map URLA data to MISMO v3.4 format and provide export endpoints.

**Requirements**:
- Map borrower info to MISMO PARTIES section
- Map loan info to MISMO LOAN section
- Map property to MISMO COLLATERALS section
- Validate exported data against MISMO schema
- Support JSON and XML output formats
- Export endpoint: GET /api/apps/:id/export?format=json|xml

**Files Created**:
- `src/lib/mismo-mapper.ts`
- `src/schemas/mismo-v3.json`
- `src/pages/api/apps/[id]/export.ts`

---

### ADMIN-01: Admin Portal
**Status**: Completed
**Priority**: High

**Description**: Administrative interface for reviewing and managing applications.

**Requirements**:
- Dashboard with application statistics
- List all applications with filtering by status
- View application details (all submitted data)
- Change application status (draft, submitted, approved, denied)
- Export applications to MISMO JSON/XML
- Delete applications

**Files Created**:
- `src/pages/admin/index.tsx`
- `src/pages/admin/apps/[id].tsx`

---

### FE-02: Form Validation with DTI/LTV
**Status**: Completed
**Priority**: Medium

**Description**: Real-time form validation with mortgage-specific checks.

**Requirements**:
- Validate required fields per step
- DTI ratio calculation and warning (>43%)
- LTV validation (max 97%, warning >80%)
- Visual feedback for errors and warnings
- Progress bar showing completion percentage
- Toggle to show/hide validation panel

**Files Created**:
- `src/lib/form-validator.ts`

---

### AUTH-01: Authentication System
**Status**: Completed
**Priority**: High

**Description**: User authentication with role-based access.

**Requirements**:
- NextAuth.js with credentials provider
- Demo accounts (borrower@demo.com, admin@demo.com)
- JWT session strategy
- Role-based UI (hide admin features from borrowers)
- Sign in/sign out functionality
- Protected routes

**Files Created**:
- `src/pages/api/auth/[...nextauth].ts`
- `src/pages/auth/signin.tsx`
- `src/components/UserMenu.tsx`
- `src/lib/auth.ts`

---

### DOC-01: Document Upload
**Status**: Completed
**Priority**: Medium

**Description**: File upload system for supporting documents.

**Requirements**:
- Accept PDF, JPG, PNG files up to 10MB
- Document type selection (W2, paystub, bank statement, etc.)
- Store files locally in uploads directory
- Required documents checklist
- View and delete uploaded documents
- API endpoints for upload, list, view, delete

**Files Created**:
- `src/components/steps/DocumentsStep.tsx`
- `src/pages/api/apps/[id]/documents/index.ts`
- `src/pages/api/apps/[id]/documents/[docId].ts`

---

### UI-01: Front-End Design Refresh
**Status**: Completed
**Priority**: Medium

**Description**: Modern, professional UI design for the application.

**Requirements**:
- Custom color palette (primary blue, success, warning, danger)
- Inter font family
- Card components with shadows and hover effects
- Enhanced form inputs with better focus states
- Step indicator with icons for status
- Gradient hero sections
- Responsive design for mobile/desktop
- Loading states and animations

**Files Modified**:
- `tailwind.config.js` - Custom colors, shadows, animations
- `src/styles/globals.css` - Component classes
- `src/pages/index.tsx` - Home page redesign
- `src/pages/auth/signin.tsx` - Sign-in page redesign
- `src/pages/admin/index.tsx` - Admin portal redesign
- `src/components/ApplicationWizard.tsx` - Progress indicator redesign

---

### INTEG-01: Mock Integrations
**Status**: Completed
**Priority**: Medium

**Description**: Add stubbed integrations for demo scenarios to simulate real mortgage workflow.

**Requirements**:
- [x] Credit pull simulation with deterministic scores (SSN-based)
- [x] Income verification stub with employment validation
- [x] Property valuation (AVM) stub with comparables
- [x] Mock pricing engine with rate adjustments

**Files Created**:
- `src/lib/integrations/credit.ts` - Credit bureau simulation
- `src/lib/integrations/income.ts` - Income/employment verification
- `src/lib/integrations/avm.ts` - Automated property valuation
- `src/lib/integrations/pricing.ts` - Mortgage pricing engine
- `src/lib/integrations/index.ts` - Module exports
- `src/pages/api/integrations/credit-pull.ts`
- `src/pages/api/integrations/verify-income.ts`
- `src/pages/api/integrations/property-value.ts`
- `src/pages/api/integrations/pricing.ts`

---

### PDF-01: URLA PDF Export
**Status**: Completed
**Priority**: Medium

**Description**: Generate filled URLA 1003 PDF from application data.

**Requirements**:
- Use official URLA form layout
- Map all application fields to PDF fields
- Generate downloadable PDF
- Include in admin portal export options

**Files Created**:
- `src/lib/pdf-generator.ts` - PDF generation with pdfmake
- `src/pages/api/apps/[id]/pdf.ts` - API endpoint

**Features**:
- Structured layout matching URLA sections
- SSN masking for security (shows only last 4 digits)
- Header with application ID, footer with timestamp
- Download via admin portal "Export URLA PDF" button

---

### ADMIN-UW-01: Admin Underwriting Panel
**Status**: Completed
**Priority**: Medium

**Description**: Interactive underwriting section in admin app detail page.

**Requirements**:
- Action buttons: Run Credit Pull, Verify Income, Get Appraisal, Get Pricing
- Results display with risk badges (green/yellow/red)
- Qualification summary card (credit score, DTI, LTV, payment)
- Expandable detail sections for each result

**Files Created**:
- `src/types/underwriting.ts` - Type definitions
- `src/lib/underwriting-utils.ts` - Risk calculation helpers

**Files Modified**:
- `src/pages/admin/apps/[id].tsx` - UI implementation

---

### TEST-02: Unit Test Suite Expansion
**Status**: Completed
**Priority**: Medium

**Description**: Comprehensive unit test coverage for business logic.

**Requirements**:
- Form validation tests (all wizard steps)
- Underwriting utilities tests (risk badges, qualification)
- Integration tests (credit, income, pricing calculations)

**Files Created**:
- `src/__tests__/form-validator.test.ts` - 45 tests
- `src/__tests__/underwriting-utils.test.ts` - 27 tests
- `src/__tests__/integrations.test.ts` - 49 tests

**Result**: 147 total unit tests (up from 26)

---

## Pending/Future Tasks

### CO-BORROWER-01: Co-Borrower UI Support
**Status**: Skipped (schema ready, UI deferred)
**Priority**: Low

**Description**: Full UI support for adding and managing co-borrowers.

**Requirements**:
- Add co-borrower button in wizard
- Separate identity/address/employment forms for each borrower
- Joint vs separate asset/liability handling
- Switch between borrowers in wizard
- Co-borrower indicator in admin view

**Proposed Changes**:
- Update ApplicationWizard to handle multiple borrowers
- Add borrower tabs/selector component
- Update step components to work with borrower index
- Update API to properly save co-borrower data

---

### TEST-01: E2E Test Suite (Cypress)
**Status**: TBD - Future
**Priority**: Low

**Description**: Cypress end-to-end tests for critical flows. Requires browser automation.

**Requirements**:
- Complete application flow test (all 10 steps)
- Admin portal test (view, status change, export)
- Authentication test (sign in, sign out, protected routes)
- Export functionality test (JSON, XML, PDF)
- Document upload test

**Proposed Files**:
- `cypress/e2e/application-flow.cy.ts`
- `cypress/e2e/admin-portal.cy.ts`
- `cypress/e2e/authentication.cy.ts`
- `cypress/e2e/export.cy.ts`
- `cypress/support/commands.ts`

---

## Future Considerations

### ESIGN-01: Electronic Signature
- Integrate with DocuSign or similar
- Sign disclosure documents
- Capture borrower signatures

### NOTIF-01: Email Notifications
- Application status updates
- Document request reminders
- Submission confirmations

### ANALYTICS-01: Application Analytics
- Time to complete by step
- Abandonment rates
- Common validation errors

### MULTI-LANG-01: Multi-Language Support
- Spanish translation
- Internationalization setup

---

## Technical Notes

### Database
- SQLite with Prisma ORM
- JSON fields stored as strings (SQLite limitation)
- Prisma pinned to v5.22.0 (v7+ has breaking changes)

### Styling
- Tailwind CSS v3.4.19 (v4 has breaking changes - do not upgrade)
- PostCSS config required (`postcss.config.js`)
- Inter font via Google Fonts
- Custom colors: primary, success, warning, danger

### Authentication
- NextAuth.js with JWT sessions
- Demo accounts for testing
- Role-based access (BORROWER, ADMIN)

### Validation
- Ajv for JSON Schema validation
- Custom form validator for mortgage-specific rules
- DTI and LTV calculations

### File Storage
- Local file storage in `/uploads` directory
- Files organized by application ID
- 10MB max file size

---

## How to Use This Document

1. **Starting new work**: Read the task description and requirements
2. **Understanding scope**: Check the files created/proposed
3. **Continuing work**: Cross-reference with SESSION.md for current progress
4. **Adding tasks**: Follow the same format for new requirements
