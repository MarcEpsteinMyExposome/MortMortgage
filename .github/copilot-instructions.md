# Copilot Instructions (project guidance)

This file contains a concise checklist and pointers for contributors and for Copilot to follow when working on the MortMortgage demo.

- [ ] Confirm repository scaffold is present (README.md, package.json, prisma, src/)
- [ ] Install dependencies: `npm install`
- [ ] Reset DB and seed demo data: `npm run resume` (or `.\iles\scripts\resume.ps1` on Windows)
- [ ] Run schema tests: `npm run test:schemas`
- [ ] Run E2E: `npm run e2e`

Project docs & task locations:
- `README.md` — high-level task list, MVP scope, and quickstart
- `docs/schema.md` — Data Model Phase A description and acceptance criteria
- `src/schemas/` — JSON Schema artifacts
- `src/fixtures/` — Deterministic fixtures for seeding and tests

Notes for contributors:
- Follow the checklist above for basic verification steps.
- Add clear instructions and acceptance criteria when creating tasks or PRs.
- If adding or changing schemas, add/adjust `src/__tests__/schema.test.ts` and update seeds.
- Keep `TASKS.md` updated with task owners, acceptance criteria, and progress. Use `TASKS.md` as the single source of truth for decisions and restart instructions.
- When a task is completed, mark it in `TASKS.md` and open a short PR/Issue referencing the task ID.

