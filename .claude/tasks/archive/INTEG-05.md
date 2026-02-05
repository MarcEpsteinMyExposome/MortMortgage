# INTEG-05: SignaturePad Component (Minimal)

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | INTEG-05 |
| **Title** | SignaturePad Component |
| **Status** | TODO |
| **Priority** | Medium |
| **Estimated Complexity** | Low |
| **Dependencies** | None |

---

## Description

Create a reusable SignaturePad component for capturing electronic signatures. This is the minimal foundation - just the component itself. Full signing flow integration (PDF embedding, co-borrower support, admin views) can be added later.

**Scope:** Component only. User will integrate into their flow.

---

## Requirements (Minimal Scope)

### Functional Requirements

1. **SignaturePad Component**
   - Touch-friendly signature capture (mouse + touch)
   - Clear button to redo
   - Save button returns base64 PNG
   - Responsive canvas sizing

2. **Optional: PDF Signer Utility**
   - Embed signature image in existing PDF
   - Add timestamp text
   - Utility function for later integration

### Non-Functional Requirements

- Mobile-friendly (touch events)
- Works offline
- TypeScript types included
- No external dependencies beyond signature_pad + pdf-lib

---

## Acceptance Criteria

- [ ] SignaturePad component renders correctly
- [ ] Can draw signature with mouse
- [ ] Can draw signature with touch (mobile)
- [ ] Clear button clears canvas
- [ ] Save returns base64 PNG string
- [ ] Canvas resizes on window resize
- [ ] Optional: pdf-signer utility embeds signature in PDF

---

## Technical Architecture

### Option A: DocuSeal (Recommended for production)
```typescript
import { DocusealForm } from '@docuseal/react';

<DocusealForm
  src={templateUrl}
  email={borrowerEmail}
  onComplete={(data) => handleSigningComplete(data)}
/>
```

**Pros:** Professional UI, legally compliant, audit trails, webhooks
**Cons:** Requires account setup, costs after free tier

### Option B: DIY with signature_pad + pdf-lib (Demo-friendly)
```typescript
import SignaturePad from 'signature_pad';
import { PDFDocument } from 'pdf-lib';

// Capture signature
const signatureData = signaturePad.toDataURL('image/png');

// Embed in PDF
const signatureImage = await pdfDoc.embedPng(signatureBytes);
page.drawImage(signatureImage, { x, y, width, height });
```

**Pros:** Free, no external deps, full control, works offline
**Cons:** DIY audit trail, simpler UI

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/SignaturePad.tsx` | Signature capture component |
| `src/lib/signing/pdf-signer.ts` | (Optional) Embed signature in PDF utility |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `signature_pad`, `pdf-lib` |

---

## Database Schema Changes

```prisma
model Application {
  // ... existing fields

  // Signature tracking
  signatureStatus     String   @default("unsigned") // unsigned | pending | signed
  borrowerSignedAt    DateTime?
  borrowerSignature   String?  // Base64 PNG of signature
  borrowerSignedIp    String?  // IP address for audit
  coBorrowerSignedAt  DateTime?
  coBorrowerSignature String?
  coBorrowerSignedIp  String?
  signedPdfPath       String?  // Path to signed PDF
  auditTrail          String?  // JSON audit log
}
```

---

## Component Implementations

### SignaturePad Component
```tsx
// src/components/SignaturePad.tsx
import { useRef, useEffect, useState } from 'react';
import SignaturePadLib from 'signature_pad';

interface Props {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
}

export default function SignaturePad({ onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pad, setPad] = useState<SignaturePadLib | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const signaturePad = new SignaturePadLib(canvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 100)'
      });
      setPad(signaturePad);

      // Handle resize
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvasRef.current!.width = canvasRef.current!.offsetWidth * ratio;
        canvasRef.current!.height = canvasRef.current!.offsetHeight * ratio;
        canvasRef.current!.getContext('2d')!.scale(ratio, ratio);
        signaturePad.clear();
      };

      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();

      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  const handleClear = () => pad?.clear();

  const handleSave = () => {
    if (pad?.isEmpty()) {
      alert('Please sign before saving');
      return;
    }
    onSave(pad!.toDataURL('image/png'));
  };

  return (
    <div className="signature-container">
      <p className="text-sm text-gray-600 mb-2">
        Sign in the box below using your mouse or finger
      </p>
      <canvas
        ref={canvasRef}
        className="w-full h-48 border-2 border-gray-300 rounded-lg bg-white"
      />
      <div className="flex justify-between mt-4">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <div className="space-x-2">
          <button onClick={handleClear} className="btn-secondary">
            Clear
          </button>
          <button onClick={handleSave} className="btn-primary">
            Accept & Sign
          </button>
        </div>
      </div>
    </div>
  );
}
```

### PDF Signing Utility
```typescript
// src/lib/signing/pdf-signer.ts
import { PDFDocument, rgb } from 'pdf-lib';

interface SignatureOptions {
  signatureBase64: string;
  signerName: string;
  signedAt: Date;
  pageIndex?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export async function embedSignatureInPdf(
  pdfBytes: Uint8Array,
  options: SignatureOptions
): Promise<Uint8Array> {
  const {
    signatureBase64,
    signerName,
    signedAt,
    pageIndex = -1, // Last page by default
    x = 100,
    y = 150,
    width = 200,
    height = 50
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex < 0 ? pages.length + pageIndex : pageIndex];

  // Embed signature image
  const signatureImageBytes = Uint8Array.from(
    atob(signatureBase64.split(',')[1]),
    c => c.charCodeAt(0)
  );
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  // Draw signature
  page.drawImage(signatureImage, { x, y, width, height });

  // Draw signature line
  page.drawLine({
    start: { x, y: y - 5 },
    end: { x: x + width, y: y - 5 },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  // Draw signer name and date
  page.drawText(`${signerName}`, {
    x,
    y: y - 20,
    size: 10,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Date: ${signedAt.toLocaleDateString()}`, {
    x,
    y: y - 35,
    size: 8,
    color: rgb(0.4, 0.4, 0.4)
  });

  return await pdfDoc.save();
}
```

---

## Implementation Phases

### Phase 1: Dependencies
- [ ] Install `signature_pad` and `pdf-lib`

### Phase 2: Component
- [ ] Create SignaturePad component

### Phase 3: Optional Utility
- [ ] Create pdf-signer utility for later integration

---

## Parallel Execution Plan

This task is small enough to run as a single agent alongside INTEG-04.

```
SINGLE AGENT:
└── Install deps → Create SignaturePad → Create pdf-signer utility
```

---

## Signature Placement in URLA PDF

```
Page 10 (last page of URLA):
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Borrower Signature                Co-Borrower Signature    │
│  ┌─────────────────────┐          ┌─────────────────────┐  │
│  │  [Signature Image]  │          │  [Signature Image]  │  │
│  └─────────────────────┘          └─────────────────────┘  │
│  ________________________          ________________________  │
│  John Smith                        Jane Smith               │
│  Date: 02/05/2026                  Date: 02/05/2026        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Coordinates (assuming 8.5x11" page, 72 DPI):
- Borrower signature: x=72, y=150, width=180, height=45
- Co-borrower signature: x=360, y=150, width=180, height=45
```

---

## Audit Trail Format

```json
{
  "documentId": "app-123",
  "documentHash": "sha256:abc123...",
  "events": [
    {
      "event": "signature_requested",
      "timestamp": "2026-02-05T10:00:00Z",
      "actor": "system"
    },
    {
      "event": "borrower_signed",
      "timestamp": "2026-02-05T10:05:23Z",
      "actor": "john.smith@email.com",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "event": "coborrower_signed",
      "timestamp": "2026-02-05T10:08:45Z",
      "actor": "jane.smith@email.com",
      "ipAddress": "192.168.1.101",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "event": "document_completed",
      "timestamp": "2026-02-05T10:08:45Z",
      "signedDocumentHash": "sha256:def456..."
    }
  ]
}
```

---

## Testing Strategy

### Unit Tests
- SignaturePad capture and clear
- PDF signature embedding
- Audit trail generation
- Signature status transitions

### Integration Tests
- Full signing flow
- Co-borrower sequential signing
- Signed PDF download
- API endpoint responses

### Manual Testing
- Mobile signature capture (touch)
- Signature appears correctly in PDF
- Download and view signed document

---

## Dependencies

```json
{
  "signature_pad": "^5.0.0",
  "pdf-lib": "^1.17.1"
}
```

Both packages are well-maintained, TypeScript-compatible, and have no external service dependencies.

---

## UI Mockups

### Sign Application Button (Review Step)
```
┌─────────────────────────────────────────────────────────┐
│  📝 Electronic Signature                                │
│                                                         │
│  Your application is complete and ready for signing.    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              [Sign Application]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Signature Status:                                      │
│  ○ Primary Borrower - Not signed                       │
│  ○ Co-Borrower - Not signed                            │
└─────────────────────────────────────────────────────────┘
```

### Signing Modal
```
┌─────────────────────────────────────────────────────────┐
│  Sign Your Application                            [X]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  By signing below, I certify that all information      │
│  provided in this application is true and accurate.     │
│                                                         │
│  Sign in the box below:                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │           [Signature Canvas Area]               │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│           [Cancel]    [Clear]    [Accept & Sign]       │
└─────────────────────────────────────────────────────────┘
```

### After Signing
```
┌─────────────────────────────────────────────────────────┐
│  ✅ Application Signed                                  │
│                                                         │
│  Signature Status:                                      │
│  ✓ Primary Borrower - Signed 02/05/2026 10:05 AM      │
│  ✓ Co-Borrower - Signed 02/05/2026 10:08 AM           │
│                                                         │
│  [View Signed Document]  [Download PDF]                │
└─────────────────────────────────────────────────────────┘
```

---

## Legal Compliance Notes

The DIY signature approach using signature_pad satisfies ESIGN Act requirements when:
1. User explicitly consents to sign electronically
2. Signature is clearly associated with the document
3. Signature record is tamper-evident (audit trail)
4. Signed document can be retained and reproduced

The audit trail JSON provides the necessary evidence chain.
