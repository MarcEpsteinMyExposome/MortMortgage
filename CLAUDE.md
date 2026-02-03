# MortMortgage — Claude Code Project Guide

> **Read this file first** when starting a new Claude Code session.

## Quick Context

**MortMortgage** is a demo mortgage application system built with Next.js, featuring:
- Full URLA 2020 form wizard (10 steps)
- Admin portal with underwriting tools
- Mock integrations (credit, income, AVM, pricing)
- MISMO JSON/XML + PDF exports
- Pre-qualification calculator & loan comparison tools

## Getting Started

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (runs on available port)
npm test           # Run 149+ unit tests
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Borrower | borrower@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

## Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with hero |
| Dashboard | `/dashboard` | Borrower's application list |
| New Application | `/apply/new` | Start URLA wizard |
| Pre-Qualify | `/prequalify` | Quick affordability calculator |
| Compare Loans | `/compare` | Side-by-side loan comparison |
| Admin Portal | `/admin` | Application management |
| Admin Analytics | `/admin/analytics` | Charts and metrics |
| Sign In | `/auth/signin` | Authentication |

## Project Structure

```
src/
├── pages/           # Next.js pages & API routes
│   ├── admin/       # Admin portal pages
│   ├── api/         # API endpoints
│   ├── apply/       # Application wizard
│   └── auth/        # Authentication
├── components/      # React components
│   ├── steps/       # Wizard step forms
│   └── charts/      # Analytics charts
├── lib/             # Business logic
│   └── integrations/# Mock APIs
├── schemas/         # JSON Schema (URLA, MISMO)
├── __tests__/       # Unit tests
└── styles/          # Global CSS
```

## Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | **This file** - Start here |
| `TASKS.md` | Task list with status |
| `SESSION.md` | Session notes |
| `REQUIREMENTS.md` | Detailed specifications |

## Tech Stack & Constraints

- **Prisma**: Pinned to v5.22.0 (v7+ has breaking changes)
- **Tailwind CSS**: Pinned to v3.4.19 (v4 has breaking changes)
- **SQLite**: Stores JSON as strings (API handles serialization)
- **NextAuth**: JWT sessions, credentials provider

## Common Tasks

### Run Tests
```bash
npm test                    # All tests
npm run test:schemas        # Schema validation only
```

### Fix Common Issues

**Port redirect after signin/signout:**
- Uses `window.location.origin` to stay on current port

**Tailwind not loading:**
- Ensure `postcss.config.js` exists
- Check Tailwind is v3.x (not v4)

### Working on New Features

1. Check `TASKS.md` for pending work
2. Review existing patterns in similar files
3. Follow Tailwind component classes from `globals.css`
4. Add tests for new business logic

## Completed Features (17 tasks)

- DM-1: Full URLA 2020 Schema
- FE-01: Multi-Step Wizard
- BE-01: Application CRUD API
- DM-2: MISMO v3.4 Export
- ADMIN-01: Admin Portal
- FE-02: Form Validation
- AUTH-01: Authentication
- DOC-01: Document Upload
- UI-01: Design Refresh
- INTEG-01: Mock Integrations
- PDF-01: URLA PDF Export
- ADMIN-UW-01: Underwriting Panel
- TEST-02: Unit Tests (149+)
- DASH-01: Borrower Dashboard
- PREQUAL-01: Pre-Qualification Calculator
- ANALYTICS-01: Admin Analytics
- COMPARE-01: Loan Comparison Tool

## Future Work

- E2E tests with Cypress
- Co-borrower UI
- Real third-party integrations
- Email notifications
