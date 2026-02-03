# URLA Core Schema (Phase A)

This directory contains the **core** URLA JSON Schema used for the demo and sample fixtures used for seeding and testing.

Files:
- `src/schemas/urla-core.json` — Minimal URLA 2020 core fields used in Phase A (borrower identity, employment, income, assets, liabilities, property basics, loan terms).
- `src/schemas/urla-full.json` — Expanded modular URLA 2020 schema (Phase B) with subschemas for `loan`, `property`, `borrower`, and extended sections: `income`, `assets`, `liabilities`, `declarations`.
- `src/schemas/mismo-lite.json` — Minimal MISMO demo contract for export mapping.
- `src/fixtures/*.json` — Deterministic fixture files (good / average / poor) and extended fixtures (co-borrower, invalid cases) used for Phase B testing.

Usage:
- Validate payloads with the Ajv helper at `src/lib/validator.ts`.
- Seed demo data using `prisma/seed.ts` (reads `src/fixtures` by default unless `SEED_FIXTURES=false`).

Versioning:
- This is Phase A (core subset). The full URLA 2020 schema will be added in a follow-up task and split into modular subschemas to simplify maintenance.
