# INTEG-03: eSign Integration (DocuSign)

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | INTEG-03 |
| **Title** | eSign Integration (DocuSign) |
| **Status** | TODO |
| **Priority** | Medium |
| **Estimated Complexity** | Medium-High |
| **Dependencies** | PDF-01 (URLA PDF Export) |

---

## Description

Integrate DocuSign for electronic document signing. Borrowers can sign their completed URLA application and disclosure documents electronically. Supports co-borrower signatures when applicable. Uses DocuSign Sandbox for demo purposes.

---

## Requirements

### Functional Requirements

1. **Sign Application Button**
   - Add "Sign Application" button on review/submit step
   - Only enabled when application is complete
   - Shows signing status after initiated

2. **DocuSign Envelope Creation**
   - Generate PDF of completed application
   - Create DocuSign envelope with signature tabs
   - Support single borrower and co-borrower flows
   - Place signature/date tabs at appropriate locations

3. **Signing Flow Options**
   - **Embedded signing** (recommended) - Sign within the app
   - Redirect signing - Opens DocuSign in new tab
   - Email signing - Send signing link via email

4. **Co-Borrower Signatures**
   - When co-borrower exists, create envelope with 2 signers
   - Sequential signing (borrower first, then co-borrower)
   - Track signature status for each party

5. **Webhook Handling**
   - Receive DocuSign Connect webhooks
   - Update application status when signed
   - Store signed document

6. **Status Tracking**
   - Show signing status: pending, sent, viewed, signed, completed
   - Display who has/hasn't signed
   - Admin view shows signature status

7. **Sandbox Mode**
   - Use DocuSign Developer Sandbox
   - Works without real DocuSign account for demos
   - Test data for predictable behavior

### Non-Functional Requirements

- Secure credential handling (server-side only)
- Loading states during DocuSign operations
- Error handling with retry options
- Signed documents stored securely

---

## Acceptance Criteria

- [ ] "Sign Application" button appears on review step
- [ ] Clicking opens DocuSign signing ceremony
- [ ] Signature tabs placed correctly on PDF
- [ ] Single borrower can complete signing
- [ ] Co-borrower flow works (both signatures)
- [ ] Webhook updates application status
- [ ] Signed PDF stored and viewable
- [ ] Admin can see signature status
- [ ] Works in sandbox without real credentials

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/integrations/docusign.ts` | DocuSign client and helpers |
| `src/pages/api/esign/create-envelope.ts` | API to create signing envelope |
| `src/pages/api/esign/get-signing-url.ts` | API to get embedded signing URL |
| `src/pages/api/esign/webhook.ts` | Handle DocuSign Connect webhooks |
| `src/pages/api/esign/status/[appId].ts` | Get signing status for application |
| `src/components/SignatureStatus.tsx` | Display signing status component |
| `src/components/SignApplicationButton.tsx` | Sign button with status |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/steps/ReviewStep.tsx` | Add sign application button |
| `src/pages/admin/apps/[id].tsx` | Show signature status |
| `src/lib/pdf-generator.ts` | Add signature field coordinates |
| `package.json` | Add `docusign-esign` dependency |
| `.env.example` | Add DocuSign env vars template |
| `prisma/schema.prisma` | Add signature status fields (optional) |

---

## Technical Notes

### DocuSign Sandbox Setup
1. Create free developer account at https://developers.docusign.com/
2. Get Integration Key (client ID) from Apps and Keys
3. Generate RSA keypair for JWT authentication
4. Note Account ID and Base URL

### Environment Variables
```bash
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_OAUTH_BASE=https://account-d.docusign.com
```

### Dependencies
```bash
npm install docusign-esign
```

### JWT Authentication Flow
```typescript
// src/lib/integrations/docusign.ts
import docusign from 'docusign-esign'

const SCOPES = ['signature', 'impersonation']

export async function getDocuSignClient() {
  const apiClient = new docusign.ApiClient()
  apiClient.setBasePath(process.env.DOCUSIGN_BASE_URL)

  const results = await apiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    SCOPES,
    process.env.DOCUSIGN_PRIVATE_KEY,
    3600
  )

  apiClient.addDefaultHeader('Authorization', `Bearer ${results.body.access_token}`)
  return apiClient
}
```

### Create Envelope with PDF
```typescript
// src/pages/api/esign/create-envelope.ts
export default async function handler(req, res) {
  const { applicationId } = req.body

  // 1. Get application data
  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  })

  // 2. Generate PDF
  const pdfBytes = await generateURLAPdf(application)
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  // 3. Create envelope definition
  const envelopeDefinition = {
    emailSubject: 'Please sign your mortgage application',
    documents: [{
      documentBase64: pdfBase64,
      name: 'URLA Application',
      fileExtension: 'pdf',
      documentId: '1'
    }],
    recipients: {
      signers: [{
        email: application.borrowerEmail,
        name: application.borrowerName,
        recipientId: '1',
        routingOrder: '1',
        tabs: {
          signHereTabs: [{
            documentId: '1',
            pageNumber: '10',
            xPosition: '100',
            yPosition: '700'
          }],
          dateSignedTabs: [{
            documentId: '1',
            pageNumber: '10',
            xPosition: '300',
            yPosition: '700'
          }]
        }
      }]
    },
    status: 'sent'
  }

  // 4. Add co-borrower if exists
  if (application.hasCoBorrower) {
    envelopeDefinition.recipients.signers.push({
      email: application.coBorrowerEmail,
      name: application.coBorrowerName,
      recipientId: '2',
      routingOrder: '2',
      tabs: {
        signHereTabs: [{
          documentId: '1',
          pageNumber: '10',
          xPosition: '100',
          yPosition: '650'
        }]
      }
    })
  }

  // 5. Send envelope
  const apiClient = await getDocuSignClient()
  const envelopesApi = new docusign.EnvelopesApi(apiClient)

  const result = await envelopesApi.createEnvelope(
    process.env.DOCUSIGN_ACCOUNT_ID,
    { envelopeDefinition }
  )

  // 6. Store envelope ID
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      docusignEnvelopeId: result.envelopeId,
      signatureStatus: 'sent'
    }
  })

  res.json({ envelopeId: result.envelopeId })
}
```

### Embedded Signing URL
```typescript
// src/pages/api/esign/get-signing-url.ts
export default async function handler(req, res) {
  const { applicationId, returnUrl } = req.body

  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  })

  const apiClient = await getDocuSignClient()
  const envelopesApi = new docusign.EnvelopesApi(apiClient)

  const viewRequest = {
    returnUrl: returnUrl,
    authenticationMethod: 'none',
    email: application.borrowerEmail,
    userName: application.borrowerName,
    clientUserId: application.id // For embedded signing
  }

  const result = await envelopesApi.createRecipientView(
    process.env.DOCUSIGN_ACCOUNT_ID,
    application.docusignEnvelopeId,
    { recipientViewRequest: viewRequest }
  )

  res.json({ signingUrl: result.url })
}
```

### Webhook Handler
```typescript
// src/pages/api/esign/webhook.ts
export default async function handler(req, res) {
  const event = req.body

  if (event.event === 'envelope-completed') {
    const envelopeId = event.data.envelopeId

    // Update application status
    await prisma.application.updateMany({
      where: { docusignEnvelopeId: envelopeId },
      data: { signatureStatus: 'completed' }
    })

    // Optionally download and store signed document
    const apiClient = await getDocuSignClient()
    const envelopesApi = new docusign.EnvelopesApi(apiClient)

    const document = await envelopesApi.getDocument(
      process.env.DOCUSIGN_ACCOUNT_ID,
      envelopeId,
      'combined'
    )

    // Store signed PDF...
  }

  res.status(200).json({ received: true })
}
```

### Signature Status Component
```tsx
// src/components/SignatureStatus.tsx
type Props = {
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | null
  borrowerSigned?: boolean
  coBorrowerSigned?: boolean
  hasCoBorrower?: boolean
}

export default function SignatureStatus({
  status,
  borrowerSigned,
  coBorrowerSigned,
  hasCoBorrower
}: Props) {
  const statusConfig = {
    draft: { label: 'Not Sent', color: 'gray', icon: '○' },
    sent: { label: 'Awaiting Signature', color: 'yellow', icon: '◐' },
    viewed: { label: 'Viewed', color: 'blue', icon: '◐' },
    signed: { label: 'Partially Signed', color: 'blue', icon: '◐' },
    completed: { label: 'Fully Signed', color: 'green', icon: '●' }
  }

  const config = statusConfig[status || 'draft']

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-${config.color}-500`}>{config.icon}</span>
        <span className="font-medium">{config.label}</span>
      </div>

      {hasCoBorrower && (
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            {borrowerSigned ? '✓' : '○'} Primary Borrower
          </div>
          <div className="flex items-center gap-2">
            {coBorrowerSigned ? '✓' : '○'} Co-Borrower
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Implementation Phases

### Phase 1: Basic Integration
- Set up DocuSign client with JWT auth
- Create envelope API endpoint
- Basic signing flow (redirect, not embedded)
- Store envelope ID on application

### Phase 2: Embedded Signing
- Implement embedded signing URL generation
- Add SignApplicationButton component
- Handle return from signing ceremony
- Update UI with signing status

### Phase 3: Webhooks & Status
- Set up DocuSign Connect webhook
- Handle envelope status updates
- Download and store signed documents
- Admin view integration

### Phase 4: Co-Borrower Support
- Multi-signer envelope creation
- Sequential signing routing
- Track individual signature status
- Handle partial completion states

---

## Testing

### Manual Testing
1. Complete an application to review step
2. Click "Sign Application"
3. Complete DocuSign signing ceremony
4. Verify status updates to "Completed"
5. Check signed document is stored
6. Test with co-borrower enabled

### Sandbox Test Notes
- Use any email addresses (sandbox doesn't send real emails)
- Signing ceremony works with any signature
- Webhook testing requires ngrok or similar for local dev

---

## Design Reference

### Review Step with Sign Button
```
┌─────────────────────────────────────────────────────────┐
│  Step 10: Review & Submit                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Application Summary                                    │
│  ─────────────────                                      │
│  Loan Amount: $350,000                                  │
│  Property: 123 Main St, Austin, TX                      │
│  Borrower: John Smith                                   │
│  Co-Borrower: Jane Smith                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📝 Electronic Signature Required                │   │
│  │                                                  │   │
│  │  Review and sign your application using         │   │
│  │  DocuSign's secure signing process.             │   │
│  │                                                  │   │
│  │  [Sign Application]                             │   │
│  │                                                  │   │
│  │  Signature Status:                              │   │
│  │  ○ Primary Borrower - Not signed                │   │
│  │  ○ Co-Borrower - Not signed                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Back] [Submit Without Sig]│
└─────────────────────────────────────────────────────────┘
```

### After Signing Complete
```
┌─────────────────────────────────────────────────────────┐
│  │  ✓ Application Signed                            │   │
│  │                                                  │   │
│  │  Signature Status:                              │   │
│  │  ✓ Primary Borrower - Signed 2/4/2026           │   │
│  │  ✓ Co-Borrower - Signed 2/4/2026                │   │
│  │                                                  │   │
│  │  [View Signed Document]  [Download PDF]         │   │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Setup

1. Create DocuSign Developer Account: https://developers.docusign.com/
2. Create new App (Integration Key)
3. Generate RSA Keypair
4. Note Account ID from account settings
5. Add env vars to `.env.local`

```bash
DOCUSIGN_INTEGRATION_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_OAUTH_BASE=https://account-d.docusign.com
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
```

---

## Alternative: HelloSign

If DocuSign setup is too complex, HelloSign (Dropbox Sign) is simpler:

```bash
npm install @dropbox/sign
```

```typescript
import { SignatureRequestApi } from '@dropbox/sign'

const api = new SignatureRequestApi()
api.username = process.env.HELLOSIGN_API_KEY

const result = await api.signatureRequestSend({
  title: 'Mortgage Application',
  signers: [{ emailAddress: email, name: name }],
  files: [pdfBuffer]
})
```

HelloSign has a simpler API but is less common in the mortgage industry.
