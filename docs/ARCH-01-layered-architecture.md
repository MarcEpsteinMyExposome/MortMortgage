# ARCH-01: Full Layered Architecture Refactor Plan

**Status**: PLANNED (not started)
**Created**: 2026-02-05
**Task ID**: ARCH-01

---

## Target Architecture

```
┌──────────────────────────────────────────────┐
│  UI Layer (components + pages)               │
│  - React components render only              │
│  - Call hooks for data, never fetch() direct │
├──────────────────────────────────────────────┤
│  Hooks Layer (src/hooks/)                    │
│  - useApplications, useDocuments, useOCR...  │
│  - Wrap fetch() calls to API routes          │
│  - Handle loading/error state                │
├──────────────────────────────────────────────┤
│  API Layer (pages/api/) - Thin Controllers   │
│  - Validate input                            │
│  - Call service functions                    │
│  - Return response                           │
├──────────────────────────────────────────────┤
│  Service Layer (src/lib/services/)           │
│  - All business logic lives here             │
│  - Calls repositories for data access        │
│  - Calls lib/ utilities for calculations     │
├──────────────────────────────────────────────┤
│  Repository Layer (src/lib/db/)              │
│  - Single Prisma instance                    │
│  - JSON serialize/deserialize handled here   │
│  - One repository per model                  │
├──────────────────────────────────────────────┤
│  Database (SQLite via Prisma)                │
└──────────────────────────────────────────────┘
```

## Current Problems

- **12 separate `new PrismaClient()` instances** — each API route creates its own
- **~40 inline `fetch()` calls** — components hardcode API URLs
- **Business logic scattered** — split across components, API routes, and lib files
- **Repeated JSON.parse()** — every route that reads from SQLite does its own parsing
- **No service layer** — API routes contain business logic directly

---

## Phase 1: Database Foundation (Prisma Singleton + JSON Helpers)

**Goal**: Eliminate 12 separate `new PrismaClient()` instances and centralize JSON serialization.

### Files to CREATE (2):

**`src/lib/db/prisma.ts`** — Singleton Prisma client
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**`src/lib/db/json-helpers.ts`** — Centralized JSON parse/stringify for SQLite
```ts
// parseAppRecord(app) → parses data + borrowers fields
// parseDocumentRecord(doc) → parses extractedData + extractedFields + fieldConfidences
// stringifyAppFields({ data, borrowers }) → stringify for storage
// stringifyDocumentFields({ extractedData, ... }) → stringify for storage
```

### Files to MODIFY (12):
Replace `const prisma = new PrismaClient()` with `import { prisma } from '../../lib/db/prisma'`:

- `src/pages/api/apps/index.ts`
- `src/pages/api/apps/[id].ts`
- `src/pages/api/apps/[id]/documents/index.ts`
- `src/pages/api/apps/[id]/documents/[docId].ts`
- `src/pages/api/apps/[id]/export.ts`
- `src/pages/api/apps/[id]/pdf.ts`
- `src/pages/api/apps/[id]/process-documents.ts`
- `src/pages/api/documents/[docId]/extraction.ts`
- `src/pages/api/documents/[docId]/process.ts`
- `src/pages/api/documents/[docId]/retry-ocr.ts`
- `src/pages/api/admin/analytics.ts`
- `src/pages/api/auth/[...nextauth].ts` (if applicable)

Also replace inline `JSON.parse(app.data || '{}')` etc. with `parseAppRecord(app)` calls.

**Total: 2 created, 12 modified**
**Tests**: All 299 should still pass (no behavior change)

---

## Phase 2: Repository Layer

**Goal**: Centralize all database queries. API routes never touch Prisma directly.

### Files to CREATE (2):

**`src/lib/db/application-repository.ts`**
```ts
// findAll() → findMany + parseAppRecord
// findById(id) → findUnique + parseAppRecord
// create({ status, data, borrowers }) → stringify + create + parse
// update(id, { status, data, borrowers }) → stringify + update + parse
// delete(id) → delete
// findWithDocuments(id) → include documents + parse all
```

**`src/lib/db/document-repository.ts`**
```ts
// findByApplicationId(appId) → findMany + parseDocumentRecord
// findById(id) → findUnique + parseDocumentRecord
// create({ applicationId, filename, contentType, path, documentType })
// delete(id)
// updateOcrResult(id, { ocrStatus, provider, extractedData, ... }) → stringify + update
// updateOcrStatus(id, status, error?)
// findByIdWithRawPath(id) → findUnique (no JSON parse, for file serving)
```

### Files to MODIFY (12):
Same 12 API routes from Phase 1 — replace `prisma.application.findMany(...)` with `applicationRepo.findAll()` etc.

**Total: 2 created, 12 modified**
**Tests**: All 299 should still pass

---

## Phase 3: Service Layer

**Goal**: Extract all business logic from API routes and components into testable service functions.

### Files to CREATE (4):

**`src/lib/services/application-service.ts`**
```ts
// listApplications() → repo.findAll()
// getApplication(id) → repo.findById() (throw if not found)
// createApplication(data) → repo.create()
// updateApplication(id, updates) → repo.update()
// deleteApplication(id) → repo.delete()
// submitApplication(id) → validate + update status
```

**`src/lib/services/document-service.ts`**
```ts
// listDocuments(applicationId) → repo.findByApplicationId()
// uploadDocument(applicationId, file, documentType) → save to disk + repo.create()
// deleteDocument(id) → delete file from disk + repo.delete()
// getDocumentFile(id) → repo.findByIdWithRawPath() + read file
// getExtractionStatus(id) → repo.findById() (select OCR fields)
```

**`src/lib/services/ocr-service.ts`**
```ts
// processDocument(docId, documentType?) → read file, call extractDocument, save results
// retryProcessing(docId, documentType?) → check retry count, process again
// batchProcess(applicationId) → process all pending documents
// extractAutoFillFields(docType, extraction) → (moved from DocumentsStep.tsx)
// buildAutoFillSuggestion(docType, extraction) → returns suggestion or null
```

**`src/lib/services/analytics-service.ts`**
```ts
// getAnalytics() → fetch all apps, compute summary/volume/status/loanType/property/activity
// (all 100+ lines of aggregation logic extracted from admin/analytics.ts API route)
```

### Files to MODIFY:

**API routes become thin controllers** (11 files):
- `src/pages/api/apps/index.ts` → calls applicationService
- `src/pages/api/apps/[id].ts` → calls applicationService
- `src/pages/api/apps/[id]/documents/index.ts` → calls documentService
- `src/pages/api/apps/[id]/documents/[docId].ts` → calls documentService
- `src/pages/api/apps/[id]/export.ts` → calls applicationService.getApplication + mismo-mapper
- `src/pages/api/apps/[id]/pdf.ts` → calls applicationService.getApplication + pdf-generator
- `src/pages/api/apps/[id]/process-documents.ts` → calls ocrService.batchProcess
- `src/pages/api/documents/[docId]/process.ts` → calls ocrService.processDocument
- `src/pages/api/documents/[docId]/extraction.ts` → calls documentService.getExtractionStatus
- `src/pages/api/documents/[docId]/retry-ocr.ts` → calls ocrService.retryProcessing
- `src/pages/api/admin/analytics.ts` → calls analyticsService.getAnalytics

**Components with business logic to extract** (2 files):
- `src/components/steps/DocumentsStep.tsx` → move `extractAutoFillFields()` to ocrService
- `src/pages/admin/apps/[id].tsx` → move `getBorrowerDataForComparison()` to a service

**Total: 4 created, 13 modified**
**Tests**: 299 should pass + write new service-layer tests

### New Tests (4 files):
- `src/__tests__/application-service.test.ts`
- `src/__tests__/document-service.test.ts`
- `src/__tests__/ocr-service.test.ts`
- `src/__tests__/analytics-service.test.ts`

---

## Phase 4: UI Hooks Layer

**Goal**: Components never call `fetch()` directly. Custom hooks wrap all API interactions.

### Files to CREATE (6):

**`src/hooks/useApplications.ts`**
```ts
// useApplications() → SWR hook for GET /api/apps
// useApplication(id) → SWR hook for GET /api/apps/:id
// useCreateApplication() → POST /api/apps
// useUpdateApplication() → PUT /api/apps/:id
// useDeleteApplication() → DELETE /api/apps/:id
```

**`src/hooks/useDocuments.ts`**
```ts
// useDocuments(applicationId) → SWR for GET /api/apps/:id/documents
// useUploadDocument(applicationId) → POST with FormData
// useDeleteDocument(applicationId) → DELETE
```

**`src/hooks/useOCR.ts`**
```ts
// useProcessDocument() → POST /api/documents/:id/process
// useRetryOCR() → POST /api/documents/:id/retry-ocr
// useExtractionStatus(docId) → GET /api/documents/:id/extraction
```

**`src/hooks/useIntegrations.ts`**
```ts
// useCreditPull() → POST /api/integrations/credit-pull
// useVerifyIncome() → POST /api/integrations/verify-income
// usePropertyValue() → POST /api/integrations/property-value
// usePricing() → POST /api/integrations/pricing
```

**`src/hooks/useAnalytics.ts`**
```ts
// useAnalytics() → SWR for GET /api/admin/analytics
```

**`src/hooks/usePlaid.ts`**
```ts
// useCreateLinkToken() → POST /api/plaid/create-link-token
// useExchangeToken() → POST /api/plaid/exchange-token
// useAccounts() → GET /api/plaid/get-accounts
```

### Files to MODIFY (7):
Replace inline fetch() calls with hook usage:

- `src/components/steps/DocumentsStep.tsx` (7 fetch calls → hooks)
- `src/components/PlaidLink.tsx` (3 fetch calls → hooks)
- `src/components/AddressAutocomplete.tsx` (2 fetch calls → hooks)
- `src/pages/admin/apps/[id].tsx` (12+ fetch calls → hooks)
- `src/pages/dashboard.tsx` (1 SWR call → useApplications hook)
- `src/pages/apply/[id].tsx` (2 fetch calls → hooks)
- `src/pages/admin/analytics.tsx` (1 fetch call → useAnalytics hook)

**Total: 6 created, 7 modified**
**Tests**: All should pass (no behavior change, just indirection)

---

## Phase 5: Cleanup & Polish

**Goal**: Remove dead code, standardize error handling, add barrel exports.

### Tasks:
- Add `src/lib/db/index.ts` barrel export
- Add `src/lib/services/index.ts` barrel export
- Add `src/hooks/index.ts` barrel export
- Remove unused direct-fetch patterns
- Standardize API error responses (consistent `{ error, details? }` shape)
- Apply `withAuth` middleware to all admin routes (currently only analytics)
- Update `CLAUDE.md` project structure section

---

## Summary

| Phase | New Files | Modified Files | Risk | Tests |
|-------|-----------|----------------|------|-------|
| 1. DB Foundation | 2 | 12 | Low | 299 pass |
| 2. Repositories | 2 | 12 | Low | 299 pass |
| 3. Services | 4 (+4 tests) | 12 | Medium | 299 + new |
| 4. UI Hooks | 6 | 7 | Medium | All pass |
| 5. Cleanup | 3 | ~5 | Low | All pass |
| **Total** | **21** | **~48** | | |

## Implementation Notes

- **Phases 1-2 can be combined** — they're both mechanical refactors with no behavior change
- **Phase 3 is the biggest risk** — extracting business logic requires careful testing
- **Phase 4 is independent** — can be done before or after Phase 3
- **Each phase is independently deployable** — app works after every phase
- **Existing lib/ files stay as-is** — integrations/, ocr/, mismo-mapper, pdf-generator don't move
