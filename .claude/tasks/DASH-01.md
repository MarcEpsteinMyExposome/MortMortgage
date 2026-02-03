# DASH-01: Borrower Dashboard

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | DASH-01 |
| **Title** | Borrower Dashboard |
| **Status** | TODO |
| **Priority** | High |
| **Estimated Complexity** | Medium |
| **Dependencies** | None |

---

## Description

Create a `/dashboard` page for authenticated borrowers to view and manage their mortgage applications. This provides a central hub for borrowers to see all their applications, track status, and continue drafts.

---

## Requirements

### Functional Requirements

1. **Application List**
   - Display all applications belonging to the logged-in user
   - Show key info: Application ID, property address, loan amount, status, last updated
   - Sort by last updated (most recent first)

2. **Status Cards/Summary**
   - Count cards at top: Total, Draft, Submitted, In Review, Approved, Denied
   - Visual indicators (icons/colors) for each status

3. **Actions**
   - "Continue" button for draft applications → navigate to wizard
   - "View" button for submitted applications → read-only summary
   - "Start New Application" button → navigate to `/apply`

4. **Empty State**
   - Friendly message when no applications exist
   - Prominent "Start Your First Application" CTA

5. **Authentication**
   - Page requires authentication (redirect to signin if not logged in)
   - Only show applications belonging to current user

### Non-Functional Requirements

- Responsive design (mobile-friendly)
- Loading state while fetching applications
- Error handling for API failures

---

## Acceptance Criteria

- [ ] Authenticated borrowers can access `/dashboard`
- [ ] Unauthenticated users are redirected to signin
- [ ] All user's applications are displayed with correct status
- [ ] Draft applications have "Continue" action
- [ ] Submitted applications have "View" action
- [ ] Status summary cards show accurate counts
- [ ] Empty state displays when no applications exist
- [ ] "Start New Application" creates new app and redirects to wizard
- [ ] Page is responsive on mobile devices

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard.tsx` | Main dashboard page component |
| `src/components/ApplicationCard.tsx` | Reusable card for displaying application summary |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` or layout | Add "Dashboard" link for authenticated users |

---

## Technical Notes

### API Usage
- Use existing `GET /api/apps` endpoint
- Filter by user on the server side (add user filtering if not present)

### Session Access
```typescript
import { useSession } from 'next-auth/react'
const { data: session, status } = useSession()
```

### Styling
- Use existing Tailwind component classes from `globals.css`
- Follow design patterns from admin portal

### Status Badge Colors
- Draft: gray
- Submitted: blue
- In Review: yellow
- Approved: green
- Denied: red

---

## Testing

### Manual Testing
1. Sign in as borrower@demo.com
2. Navigate to /dashboard
3. Verify applications display correctly
4. Test "Continue" on draft app
5. Test "Start New Application"
6. Sign out and verify redirect to signin

### Unit Tests (Optional)
- Test ApplicationCard component rendering
- Test status badge color mapping
- Test empty state rendering

---

## Design Reference

```
┌─────────────────────────────────────────────────────────┐
│  My Applications                    [Start New App]     │
├─────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │  3  │ │  1  │ │  1  │ │  0  │ │  1  │              │
│  │Total│ │Draft│ │Subm.│ │Review│ │Appr.│              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏠 123 Main St, Austin TX                       │   │
│  │ Loan: $350,000 | Status: Draft | Updated: Today │   │
│  │                                      [Continue] │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏠 456 Oak Ave, Denver CO                       │   │
│  │ Loan: $425,000 | Status: Submitted | Jan 15     │   │
│  │                                          [View] │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```
