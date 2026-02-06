# Getting Started with MortMortgage

A step-by-step guide to go from `git clone` to a fully running local environment.

---

## Quick Overview (< 2 minutes to read)

1. **Install prerequisites** (Node.js 18+, Git, VS Code)
2. **Clone the repo**
3. **Install dependencies** (`npm install`)
4. **Create your `.env.local` file** (copy from `.env.example`)
5. **Initialize the database** (`npx prisma db push`)
6. **Seed demo data** (`npm run dev:seed`)
7. **Run the tests** to verify everything works (`npm test`)
8. **Start the dev server** (`npm run dev`)
9. **Set up Claude Code in VS Code** (extension + API key)

---

## Detailed Steps

### 1. Install Prerequisites

You need three things installed before you start:

| Tool | Minimum Version | Download |
|------|-----------------|----------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |

Verify your Node version:
```bash
node --version   # must be 18.x or higher
npm --version    # comes with Node
```

### 2. Clone the Repo

```bash
git clone <repository-url>
cd MortMortgage
```

### 3. Install Dependencies

```bash
npm install
```

This installs ~65 packages including Next.js, Prisma, Tailwind, Tesseract.js, and all test tooling.

> **Windows note:** The `canvas` package (used for test fixture generation) may need build tools. If `npm install` fails on `canvas`, install the [windows-build-tools](https://github.com/nicedoc/windows-build-tools) or skip it — the app itself doesn't need `canvas` to run.

### 4. Create Your `.env.local` File

Copy the example and adjust if needed:

```bash
cp .env.example .env.local
```

**On Windows (Command Prompt):**
```cmd
copy .env.example .env.local
```

The defaults in `.env.example` work out of the box:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change_this_to_a_secure_random_value"
MOCK_MODE="true"
```

**Optional API keys** (the app works without these — features gracefully fall back):

| Key | What it enables | How to get it |
|-----|-----------------|---------------|
| `GOOGLE_PLACES_API_KEY` | Address autocomplete in the wizard | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — enable Places API + Geocoding API |
| `PLAID_CLIENT_ID` + `PLAID_SECRET` | Bank account linking & income verification | [Plaid Dashboard](https://dashboard.plaid.com/signup) (free sandbox) |
| `ANTHROPIC_API_KEY` | AI-powered document OCR (Claude Vision) | [Anthropic Console](https://console.anthropic.com) |

Without these keys:
- Address fields use manual entry (no autocomplete)
- Plaid shows demo mode with mock bank data
- Document OCR uses Tesseract.js (local, free, no API key needed)

### 5. Initialize the Database

```bash
npx prisma db push
```

This creates a SQLite database at `prisma/dev.db` using the schema defined in [`prisma/schema.prisma`](prisma/schema.prisma).

> **Important (Windows):** If you ever need to modify the Prisma schema later, **stop the dev server first** before running `npx prisma generate`. The Windows query engine DLL gets locked by the running Next.js process.

### 6. Seed Demo Data

```bash
npm run dev:seed
```

This runs [`prisma/seed.ts`](prisma/seed.ts) which:
- Creates a demo admin user
- Loads sample mortgage applications from [`src/fixtures/`](src/fixtures/)

To start completely fresh at any point:
```bash
npm run resume    # resets DB + re-seeds (alias for dev:reset + dev:seed)
```

### 7. Run the Tests

```bash
npm test
```

You should see **310+ tests passing** across 14 test files in [`src/__tests__/`](src/__tests__/). All tests should pass on a fresh clone with no API keys configured.

If you also want to run OCR integration tests (requires test fixture images):
```bash
npm run generate:docs   # generates synthetic W2/paystub/bank statement PNGs
npm run test:ocr        # runs OCR tests against those images
```

### 8. Start the Dev Server

```bash
npm run dev
```

The app starts at **http://localhost:3000** (or the next available port).

**Demo accounts** (no signup needed):

| Role | Email | Password |
|------|-------|----------|
| Borrower | `borrower@demo.com` | `demo123` |
| Admin | `admin@demo.com` | `admin123` |

**Key pages to try:**

| Page | URL | What to look for |
|------|-----|------------------|
| Home | `/` | Landing page |
| Sign In | `/auth/signin` | Use demo accounts above |
| Dashboard | `/dashboard` | Borrower's application list |
| New Application | `/apply/new` | 10-step URLA wizard |
| Pre-Qualify | `/prequalify` | Affordability calculator |
| Compare Loans | `/compare` | Side-by-side scenarios |
| Admin Portal | `/admin` | All applications + underwriting |
| Admin Analytics | `/admin/analytics` | Charts and metrics |

### 9. Set Up Claude Code in VS Code

This project is built to work with Claude Code as a development companion.

**Install the extension:**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for **"Claude Code"** by Anthropic
4. Install it
5. Sign in with an Anthropic account ([console.anthropic.com](https://console.anthropic.com))

**First session:**
1. Open the MortMortgage folder in VS Code
2. Open the Claude Code panel (`Ctrl+Shift+P` → "Claude Code: Open")
3. Claude automatically reads [`CLAUDE.md`](CLAUDE.md) for full project context

**Helpful first prompts:**
- `Read CLAUDE.md and orient me to the project`
- `What tasks are pending? Check TASKS.md`
- `Run the tests and tell me the results`

**Key documentation Claude will use:**

| File | Purpose |
|------|---------|
| [`CLAUDE.md`](CLAUDE.md) | Project overview — Claude reads this first |
| [`TASKS.md`](TASKS.md) | Task history, status, and backlog |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Detailed feature specifications |
| [`SESSION.md`](SESSION.md) | Session notes for continuity |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Coding standards, design system, and PR workflow |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm install` fails on `canvas` | Install Windows build tools, or ignore — `canvas` is only for generating test images |
| Prisma "EPERM" or "operation not permitted" | Stop the dev server, then retry `npx prisma generate` |
| Tailwind styles not loading | Verify `postcss.config.js` exists in the project root |
| Sign-in redirects to wrong port | This is handled — the app uses `window.location.origin` |
| Tests fail with "Cannot find module" | Run `npm install` again, then `npx prisma generate` |
| OCR tests fail | Run `npm run generate:docs` first to create test fixture images |

---

## What's in the Box

For a full feature list, see [`FEATURES.md`](FEATURES.md). The short version:

- Full URLA 2020 mortgage application (10-step wizard)
- Admin portal with underwriting tools
- Mock integrations (credit, income, property valuation, pricing)
- MISMO v3.4 JSON/XML + PDF export
- AI document OCR (Claude + Tesseract fallback)
- Pre-qualification calculator and loan comparison tool
- 310+ unit tests
