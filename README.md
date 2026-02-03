# MortMortgage Demo

Demo web-first mortgage application (MVP) for industry demonstration.

## Overview ✅
- Next.js (TypeScript) + Tailwind CSS
- Backend: Next API routes + Prisma (SQLite) for local dev
- Standards: URLA 2020 data model + MISMO v3.x exports (stubbed)
- Mocked integrations: credit, ID, bank-verification, AVM/pricing, eSign
- Auth: Magic-link for borrowers, email/password for admin
- Docs: local file uploads with test fixtures
- Tests: Jest + RTL and Cypress E2E

## Quickstart (developer)
1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Dev: `npm run dev`
4. Seed demo data: `npm run dev:seed`
5. Run E2E: `npm run e2e`

## Resume / Reproducibility
- Use `npm run resume` to reset DB and re-seed demo data.
- A `scripts/resume.ps1` helper is provided for Windows environments.

## Working with Claude
This project is developed with Claude Code. To resume work:
1. Run `npm run resume` to reset and seed the database
2. Open Claude Code and say: "Read TASKS.md and continue where we left off"

See `TASKS.md` for detailed Claude restart instructions and recommended prompts.

---

## MVP Scope
- Full borrower application (URLA 2020 fields) with multi-borrower support
- Admin portal for reviewers
- MISMO JSON/XML export and sample URLA PDF generation (stubbed)
- Deterministic mock third-party responses for demo scenarios
- Tests that fake document upload and application flows

## Next Steps
- Implement MISMO mapping and full URLA PDF builder
- Add richer UI polish and branding
- Integrate real 3rd-party providers if desired

## Task list & Decisions 📋
The full, versioned set of decisions and the detailed task plan are maintained in `TASKS.md`. This file includes restart instructions, sprint tasks, acceptance criteria, and fixtures used for seeding and tests. See `TASKS.md` for the single-source-of-truth for work and how to resume the demo at any time.
