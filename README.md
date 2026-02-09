# MortMortgage Demo

Demo web-first mortgage application (MVP) for industry demonstration.

## Overview
- Next.js (TypeScript) + Tailwind CSS v3
- Backend: Next API routes + Prisma (SQLite) for local dev
- Standards: URLA 2020 data model + MISMO v3.x exports
- Mocked integrations: credit, income verification, AVM/pricing
- Auth: NextAuth.js with role-based access (Borrower, Caseworker, Admin, Supervisor)
- Docs: local file uploads with validation
- Tests: Jest + React Testing Library (351 unit tests)

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npx prisma db push

# 3. Seed demo data (base fixtures + caseworker data)
npm run dev:seed
npm run dev:seed-caseworkers

# 4. Start dev server
npm run dev

# 5. Run tests
npm test
```
App runs at http://localhost:3000 (or next available port)

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Borrower | borrower@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |
| Supervisor | supervisor@demo.com | demo123 |
| Caseworker | caseworker1@demo.com | demo123 |
| Caseworker | caseworker2@demo.com | demo123 |
| Caseworker | caseworker3@demo.com | demo123 |
| Caseworker | caseworker4@demo.com | demo123 |

## Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page |
| Dashboard | `/dashboard` | Borrower's application list |
| New Application | `/apply/new` | Start URLA wizard |
| Pre-Qualify | `/prequalify` | Quick affordability calculator |
| Compare Loans | `/compare` | Side-by-side loan comparison |
| Admin Portal | `/admin` | Application management + assignment |
| Admin Analytics | `/admin/analytics` | Charts and metrics |
| Caseworker Queue | `/caseworker` | Caseworker workbench (queue + history) |
| Supervisor Dashboard | `/supervisor` | Workload, risk analysis, performance trends |
| Caseworker Management | `/admin/caseworkers` | Add/deactivate caseworkers |

## Completed Features (20 tasks)

### Core Application
- Full URLA 2020 form wizard (10 steps)
- Admin portal with application management
- MISMO JSON/XML export + URLA PDF export
- Document upload system
- Authentication with role-based access
- Co-borrower support

### Mock Integrations
- Credit pull simulation (SSN-based scoring)
- Income/employment verification
- Automated property valuation (AVM)
- Pricing engine with rate adjustments

### Admin Tools
- Underwriting panel with risk badges
- Analytics dashboard with charts (Recharts)
- Caseworker assignment (manual + auto-assign round-robin)
- Assignment audit trail

### Caseworker Queues & Supervisor Dashboards (NEW)
- **Caseworker workbench**: personal queue sorted by priority/SLA/age, completion history, performance stats
- **Supervisor dashboard**: team workload distribution chart, LTV/DTI risk analysis (stacked bar charts), 6-month performance trend (multi-line), recent assignment activity feed
- **Priority system**: urgent/high/normal/low with color-coded badges
- **SLA tracking**: overdue (red), at-risk (yellow), on-track (green)
- **Role hierarchy**: SUPERVISOR > ADMIN > CASEWORKER > BORROWER
- **Caseworker management**: add/deactivate caseworkers, view metrics
- **Rich seed data**: 46 applications with realistic distributions across 4 caseworkers

### Borrower Tools
- Personal dashboard with application status
- Pre-qualification calculator
- Loan comparison tool (2-3 scenarios)

### Testing
- 351 unit tests covering all business logic

## Project Status
| Category | Status |
|----------|--------|
| Core Features | 20 tasks complete |
| Unit Tests | 351 tests passing |
| E2E Tests | TBD - Future |

## Documentation
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code entry point (read this first) |
| `CONTRIBUTING.md` | Setup guide and coding standards |
| `FEATURES.md` | Product overview (non-technical) |
| `DEPLOYMENT.md` | Production deployment guide |
| `TASKS.md` | Task list with status and restart guide |
| `REQUIREMENTS.md` | Detailed task specifications |
| `SESSION.md` | Session notes for continuity |

## CI/CD
- **GitHub Actions**: Tests run automatically on push/PR (see `.github/workflows/ci.yml`)
- **Deployment**: See `DEPLOYMENT.md` for production setup

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
