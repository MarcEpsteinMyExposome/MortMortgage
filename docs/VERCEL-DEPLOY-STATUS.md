# Vercel Deployment — Current Status & Next Steps

## What's Done (Code Changes — All Complete, Uncommitted)

### 1. Centralized Prisma Client
- **Created** `src/lib/prisma.ts` — single Prisma instance for the whole app
  - Detects `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars → uses Turso adapter
  - Otherwise → uses standard SQLite (local dev, unchanged)
- **Created** `src/lib/env.ts` — `isVercel` helper (`process.env.VERCEL === '1'`)

### 2. Updated Prisma Schema
- `prisma/schema.prisma` — added `previewFeatures = ["driverAdapters"]` to generator block
- Backward compatible — only activates when adapter is passed at runtime

### 3. Replaced 22 PrismaClient Instances
- Every API route now imports from `src/lib/prisma` instead of creating `new PrismaClient()`
- Files changed: all 22 under `src/pages/api/`

### 4. Guarded Filesystem Operations for Vercel
- Upload endpoint returns 501 on Vercel (no writable filesystem)
- OCR/document processing endpoints return 501 on Vercel
- Document download gracefully handles missing files on Vercel
- Files: `documents/index.ts`, `documents/[docId].ts`, `process.ts`, `retry-ocr.ts`, `process-documents.ts`

### 5. Dependencies & Config
- `package.json` — added `@libsql/client@^0.8.1`, `@prisma/adapter-libsql@5.22.0`, `@testing-library/dom`
- `package.json` — updated `build` script to `prisma generate && next build`, added `postinstall`
- Created `vercel.json` (minimal: `{ "framework": "nextjs" }`)
- Updated `.env.example` with Turso variable documentation

### 6. Previous Changes (Also Uncommitted)
- `src/pages/auth/signin.tsx` — added Supervisor (amber) and Caseworker (emerald) demo account buttons
- `src/pages/api/admin/seed-demo.ts` — POST endpoint to seed 46 demo apps from the UI
- `src/pages/supervisor/index.tsx` — "Seed Demo Data" button in action bar

### 7. Tests
- **All 351 tests pass** (15 suites, 0 failures)
- `npm install` works cleanly including `postinstall: prisma generate`

---

## What's Left — Turso + Vercel Setup

### Step 1: Create Turso Database
You created a Turso Cloud account. Now you need:

```bash
# Install Turso CLI (if not installed)
# Windows: use scoop or download from https://docs.turso.tech/cli/installation
scoop install turso
# OR on PowerShell:
irm https://get.tur.so/install.ps1 | iex

# Login (opens browser)
turso auth login

# Create database
turso db create mortmortgage-demo

# Get the URL (you'll need this)
turso db show mortmortgage-demo --url
# Output: libsql://mortmortgage-demo-XXXXX.turso.io

# Create auth token (you'll need this)
turso db tokens create mortmortgage-demo
# Output: eyJhb... (long JWT token)
```

### Step 2: Apply Schema to Turso
Turso is SQLite-compatible, but you need to create the tables.

**Option A — Generate migration SQL locally:**
```bash
npx prisma migrate dev --name init --create-only
# Creates: prisma/migrations/XXXXXXXX_init/migration.sql
# Then apply it to Turso:
turso db shell mortmortgage-demo < prisma/migrations/XXXXXXXX_init/migration.sql
```

**Option B — Push schema directly (simpler for demo):**
Since Turso uses libsql which is SQLite-compatible, you can also manually create tables.
The simplest approach is to use the Turso web dashboard to run the SQL from the migration.

### Step 3: Connect GitHub Repo to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework preset: Next.js (auto-detected)
4. Set these environment variables in the Vercel dashboard:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `file:./dev.db` | Needed for Prisma generate during build |
| `TURSO_DATABASE_URL` | `libsql://mortmortgage-demo-XXXXX.turso.io` | From step 1 |
| `TURSO_AUTH_TOKEN` | `eyJhb...` | From step 1 |
| `NEXTAUTH_SECRET` | (random string) | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel domain |
| `MOCK_MODE` | `true` | Keep mock integrations |

5. Deploy

### Step 4: Seed Demo Data
After deploying:
1. Visit your Vercel URL
2. Sign in as `supervisor@demo.com` / `demo123`
3. Click "Seed Demo Data" button on the supervisor dashboard
4. Wait for confirmation, then all dashboards should populate

---

## Architecture Summary

```
Local Development:
  App → src/lib/prisma.ts → PrismaClient() → file:./dev.db (SQLite)

Vercel Production:
  App → src/lib/prisma.ts → PrismaClient({ adapter }) → Turso (libsql HTTP)
```

The `src/lib/prisma.ts` file detects the environment automatically:
- `TURSO_DATABASE_URL` set? → Use Turso adapter (production)
- Not set? → Use standard SQLite (local dev)

No code changes needed between environments. Same schema, same queries.

## Files to Commit

All these files have uncommitted changes:
- `prisma/schema.prisma`
- `package.json` + `package-lock.json`
- `src/lib/prisma.ts` (new)
- `src/lib/env.ts` (new)
- `src/pages/api/admin/seed-demo.ts` (new)
- `vercel.json` (new)
- `.env.example`
- `src/pages/auth/signin.tsx`
- `src/pages/supervisor/index.tsx`
- 22 API route files (PrismaClient replacement)
- 5 upload/OCR route files (Vercel guards)
