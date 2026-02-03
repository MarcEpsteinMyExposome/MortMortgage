# MortMortgage Demo

Demo web-first mortgage application (MVP) for industry demonstration.

## Overview
- Next.js (TypeScript) + Tailwind CSS v3
- Backend: Next API routes + Prisma (SQLite) for local dev
- Standards: URLA 2020 data model + MISMO v3.x exports
- Mocked integrations: credit, income verification, AVM/pricing
- Auth: NextAuth.js with demo accounts (borrower/admin)
- Docs: local file uploads with validation
- Tests: Jest + React Testing Library (147 unit tests)

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
App runs at http://localhost:3000

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Borrower | borrower@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

## Completed Features
- Full URLA 2020 form wizard (10 steps)
- Admin portal with application management
- MISMO JSON/XML export
- URLA PDF export
- Mock integrations (credit, income, AVM, pricing)
- Admin underwriting panel with risk badges
- Document upload system
- Authentication with role-based access
- 147 unit tests covering all business logic

## Project Status
| Category | Status |
|----------|--------|
| Core Features | 13 tasks complete |
| Unit Tests | 147 tests passing |
| E2E Tests | TBD - Future |
| Co-Borrower UI | Skipped (schema ready) |

## Documentation
| File | Purpose |
|------|---------|
| `TASKS.md` | Task list with status and restart guide |
| `REQUIREMENTS.md` | Detailed task specifications |
| `SESSION.md` | Session notes for continuity |

## Working with Claude
This project is developed with Claude Code. To resume work:
1. Run `npm install` and `npm run dev`
2. Open Claude Code and say: "Read TASKS.md, REQUIREMENTS.md, and SESSION.md"

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS v3.4.19
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (dev), JSON fields as strings
- **Auth**: NextAuth.js with JWT sessions
- **Validation**: Ajv (JSON Schema), custom form validators
- **Testing**: Jest, React Testing Library
- **PDF**: pdfmake

## Key Constraints
- Prisma pinned to v5.22.0 (v7+ has breaking changes)
- Tailwind CSS pinned to v3.4.19 (v4 has breaking changes)
- `postcss.config.js` is required for Tailwind
- SQLite stores JSON as strings (API handles serialization)
