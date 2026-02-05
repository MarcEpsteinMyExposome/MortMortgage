# INTEG-04: AI Document Intelligence

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | INTEG-04 |
| **Title** | AI Document Intelligence (OCR + Auto-Extract) |
| **Status** | TODO |
| **Priority** | High |
| **Estimated Complexity** | High |
| **Dependencies** | DOC-01 (Document Upload) |

---

## Description

Add AI-powered document processing to automatically extract data from uploaded mortgage documents (W2s, paystubs, bank statements). Extracted data pre-fills form fields and flags discrepancies. Uses a tiered approach: Claude API for intelligent extraction (primary) with Tesseract.js fallback for demos without API keys.

---

## Requirements

### Functional Requirements

1. **Automatic Document Processing**
   - Process documents immediately after upload
   - Support W2, paystub, bank statement, tax return extraction
   - Show processing status (pending → processing → complete/failed)

2. **Intelligent Field Extraction**
   - W2: Employer name, wages/salary, federal tax withheld, SSN (masked)
   - Paystub: Employer, gross pay, pay period, YTD earnings
   - Bank Statement: Institution, account type, ending balance, statement period
   - Tax Return: AGI, total income, filing status

3. **Data Validation & Comparison**
   - Compare extracted income vs entered income
   - Flag discrepancies with confidence scores
   - Show side-by-side comparison: "Document shows $85,000 | You entered $90,000"

4. **Auto-Fill Suggestions**
   - Offer to populate form fields from extracted data
   - User confirms before auto-fill (not automatic)
   - Track which fields came from OCR vs manual entry

5. **Admin Review Panel**
   - View all extracted data per document
   - Confidence badges (green ≥90%, yellow 70-89%, red <70%)
   - Manual correction capability
   - Re-process button for failed extractions

6. **Graceful Degradation**
   - Works without API key (shows "OCR not configured" message)
   - Demo mode with mock extraction data
   - Tesseract.js fallback for basic text extraction

### Non-Functional Requirements

- Process documents asynchronously (don't block upload)
- Store extraction results in database
- Secure handling of sensitive data (mask SSN in logs)
- Error recovery with retry logic (max 3 attempts)

---

## Acceptance Criteria

- [ ] Documents show processing status after upload
- [ ] W2 extraction identifies employer and income
- [ ] Paystub extraction identifies pay period and amounts
- [ ] Bank statement extraction identifies balances
- [ ] Extracted data displayed with confidence scores
- [ ] "Use extracted data" button pre-fills form fields
- [ ] Discrepancy warnings shown when data conflicts
- [ ] Admin can view/edit extracted fields
- [ ] Works in demo mode without API key
- [ ] Failed extractions can be retried

---

## Technical Architecture

### Option A: Claude API (Recommended for accuracy)
```typescript
// Uses Claude's vision capability to analyze document images
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type, data } },
      { type: "text", text: EXTRACTION_PROMPT }
    ]
  }]
});
```

### Option B: Tesseract.js (Free fallback)
```typescript
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
// Then use regex/parsing to extract fields
```

### Option C: AWS Textract (Production-grade)
```typescript
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
// Use Analyze Lending API for mortgage-specific extraction
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/ocr/index.ts` | OCR orchestrator (selects provider) |
| `src/lib/ocr/claude-extractor.ts` | Claude API document extraction |
| `src/lib/ocr/tesseract-extractor.ts` | Tesseract.js fallback |
| `src/lib/ocr/extraction-prompts.ts` | Document-specific extraction prompts |
| `src/lib/ocr/field-parsers.ts` | Parse/normalize extracted fields |
| `src/pages/api/documents/[docId]/process.ts` | Trigger OCR processing |
| `src/pages/api/documents/[docId]/extraction.ts` | Get extraction results |
| `src/components/ExtractionStatus.tsx` | Processing status indicator |
| `src/components/ExtractionResults.tsx` | Display extracted fields |
| `src/components/DataComparisonPanel.tsx` | Compare extracted vs entered |
| `src/components/AutoFillSuggestion.tsx` | Suggest form auto-fill |

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add OCR fields to Document model |
| `src/components/steps/DocumentsStep.tsx` | Show extraction status |
| `src/components/DocumentUpload.tsx` | Trigger processing after upload |
| `src/pages/admin/apps/[id].tsx` | Add extraction review panel |
| `package.json` | Add `@anthropic-ai/sdk`, `tesseract.js` |
| `.env.example` | Add `ANTHROPIC_API_KEY` |

---

## Database Schema Changes

```prisma
model Document {
  // ... existing fields

  // OCR Processing
  ocrStatus         String   @default("pending") // pending | processing | completed | failed
  ocrProvider       String?  // claude | tesseract | textract
  extractedData     String?  // JSON: raw extraction output
  extractedFields   String?  // JSON: normalized field map
  extractionConfidence Float? // 0-100 overall confidence
  fieldConfidences  String?  // JSON: per-field confidence scores
  processingError   String?  // Error message if failed
  processedAt       DateTime?
  retryCount        Int      @default(0)
}
```

---

## Extraction Prompt Example (Claude)

```typescript
const W2_EXTRACTION_PROMPT = `
Analyze this W-2 tax form image and extract the following fields.
Return ONLY a JSON object with these exact keys:

{
  "employerName": "string or null",
  "employerEIN": "string or null",
  "employerAddress": "string or null",
  "employeeName": "string or null",
  "employeeSSN": "last 4 digits only, string or null",
  "wagesTipsCompensation": "number or null (box 1)",
  "federalIncomeTaxWithheld": "number or null (box 2)",
  "socialSecurityWages": "number or null (box 3)",
  "medicareWages": "number or null (box 5)",
  "taxYear": "number or null",
  "confidence": "number 0-100"
}

If a field is not visible or unclear, use null.
For currency values, return as numbers without $ or commas.
`;
```

---

## Implementation Phases

### Phase 1: Infrastructure (Can run in parallel)
- [ ] 1A: Update Prisma schema with OCR fields
- [ ] 1B: Create OCR orchestrator and provider interface
- [ ] 1C: Create extraction prompts for each document type
- [ ] 1D: Create field normalization utilities

### Phase 2: Claude Extractor
- [ ] 2A: Implement Claude API integration
- [ ] 2B: Create document type detection
- [ ] 2C: Add confidence scoring logic
- [ ] 2D: Handle errors and retries

### Phase 3: Tesseract Fallback
- [ ] 3A: Implement Tesseract.js extractor
- [ ] 3B: Create regex parsers for common patterns
- [ ] 3C: Add demo mode with mock data

### Phase 4: API Endpoints
- [ ] 4A: Create process trigger endpoint
- [ ] 4B: Create extraction results endpoint
- [ ] 4C: Integrate with document upload flow

### Phase 5: UI Components
- [ ] 5A: Extraction status indicator
- [ ] 5B: Extraction results display
- [ ] 5C: Data comparison panel
- [ ] 5D: Auto-fill suggestions

### Phase 6: Admin Integration
- [ ] 6A: Add extraction panel to admin detail page
- [ ] 6B: Add edit/retry capabilities
- [ ] 6C: Confidence badge display

---

## Parallel Execution Plan

```
PARALLEL GROUP 1 (Infrastructure):
├── Agent A: Prisma schema migration
├── Agent B: OCR orchestrator + types
├── Agent C: Extraction prompts (all doc types)
└── Agent D: Field parsers + normalizers

PARALLEL GROUP 2 (Extractors):
├── Agent A: Claude extractor implementation
└── Agent B: Tesseract fallback implementation

PARALLEL GROUP 3 (API + UI):
├── Agent A: API endpoints (process + get results)
├── Agent B: ExtractionStatus + ExtractionResults components
└── Agent C: DataComparisonPanel + AutoFillSuggestion components

SEQUENTIAL (Integration):
└── Integrate all pieces, add to DocumentsStep and Admin page
```

---

## Testing Strategy

### Unit Tests
- Extraction prompt response parsing
- Field normalization (currency, dates, SSN masking)
- Confidence calculation
- Provider fallback logic

### Integration Tests
- Full extraction flow with mock Claude responses
- Tesseract extraction with test images
- Database storage and retrieval
- Error handling and retries

### Test Fixtures
- Sample W2 images (clear, blurry, rotated)
- Sample paystub images
- Sample bank statement images
- Expected extraction results for each

---

## Environment Variables

```bash
# Required for Claude extraction
ANTHROPIC_API_KEY=sk-ant-...

# Optional: AWS Textract (production)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

---

## Demo Mode Behavior

When no API key is configured:
1. Show "AI extraction not available" message
2. Use mock extraction data for demo purposes
3. Still show full UI with sample data
4. Allow manual entry without extraction

Mock data provides realistic demo experience without API costs.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API costs | Use caching, batch processing, demo mode |
| Accuracy issues | Confidence scores, manual review, human-in-loop |
| Slow processing | Async processing, status updates, background jobs |
| Privacy concerns | Mask SSN, don't log PII, secure storage |

---

## Success Metrics

- 80%+ of documents successfully extracted
- 90%+ accuracy on clear documents
- <5 second processing time per document
- Zero PII leakage in logs
