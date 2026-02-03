# MortMortgage Demo

Demo web-first mortgage application (MVP) for industry demonstration.

## Overview
- Next.js (TypeScript) + Tailwind CSS v3
- Backend: Next API routes + Prisma (SQLite) for local dev
- Standards: URLA 2020 data model + MISMO v3.x exports
- Mocked integrations: credit, income verification, AVM/pricing
- Auth: NextAuth.js with demo accounts (borrower/admin)
- Docs: local file uploads with validation
- Tests: Jest + React Testing Library (149+ unit tests)

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npx prisma db push

# 3. Start dev server
npm run dev

# 4. Run tests
npm test
```
App runs at http://localhost:3000 (or next available port)

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Borrower | borrower@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

## Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page |
| Dashboard | `/dashboard` | Borrower's application list |
| New Application | `/apply/new` | Start URLA wizard |
| Pre-Qualify | `/prequalify` | Quick affordability calculator |
| Compare Loans | `/compare` | Side-by-side loan comparison |
| Admin Portal | `/admin` | Application management |
| Admin Analytics | `/admin/analytics` | Charts and metrics |

## Completed Features (17 tasks)

### Core Application
- Full URLA 2020 form wizard (10 steps)
- Admin portal with application management
- MISMO JSON/XML export + URLA PDF export
- Document upload system
- Authentication with role-based access

### Mock Integrations
- Credit pull simulation (SSN-based scoring)
- Income/employment verification
- Automated property valuation (AVM)
- Pricing engine with rate adjustments

### Admin Tools
- Underwriting panel with risk badges
- Analytics dashboard with charts (Recharts)

### Borrower Tools
- Personal dashboard with application status
- Pre-qualification calculator
- Loan comparison tool (2-3 scenarios)

### Testing
- 149+ unit tests covering all business logic

## Project Status
| Category | Status |
|----------|--------|
| Core Features | 17 tasks complete |
| Unit Tests | 149+ tests passing |
| E2E Tests | TBD - Future |
| Co-Borrower UI | Skipped (schema ready) |

## Documentation
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code entry point (read this first) |
| `CONTRIBUTING.md` | Setup guide and coding standards |
| `TASKS.md` | Task list with status and restart guide |
| `REQUIREMENTS.md` | Detailed task specifications |
| `SESSION.md` | Session notes for continuity |

## Working with Claude Code
This project is developed with Claude Code. To resume work:
1. Run `npm install` and `npm run dev`
2. Claude will automatically read `CLAUDE.md` on startup
3. Or say: "Read TASKS.md and SESSION.md for full context"

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS v3.4.19
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (dev), JSON fields as strings
- **Auth**: NextAuth.js with JWT sessions
- **Validation**: Ajv (JSON Schema), custom form validators
- **Testing**: Jest, React Testing Library
- **Charts**: Recharts
- **PDF**: pdfmake

## Key Constraints
- Prisma pinned to v5.22.0 (v7+ has breaking changes)
- Tailwind CSS pinned to v3.4.19 (v4 has breaking changes)
- `postcss.config.js` is required for Tailwind
- SQLite stores JSON as strings (API handles serialization)
- Sign-in/out redirects use `window.location.origin` for port flexibility
