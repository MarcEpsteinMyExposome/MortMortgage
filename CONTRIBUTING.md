# Contributing to MortMortgage

Welcome! This guide will help you get set up and contributing to MortMortgage.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Working with Claude Code](#working-with-claude-code)
- [Coding Standards](#coding-standards)
- [Frontend Design Guidelines](#frontend-design-guidelines)
- [Submitting Changes](#submitting-changes)

---

## Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| Claude Code Extension | Latest | VS Code Marketplace |

### Claude Code Setup
1. Install the "Claude Code" extension by Anthropic in VS Code
2. Sign in with an Anthropic account at [console.anthropic.com](https://console.anthropic.com)
3. Ensure you have API credits available

---

## Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MortMortgage
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Configure Optional Integrations

The app works without these, but some features require API keys in `.env`:

| Integration | Keys Required | Feature |
|-------------|---------------|---------|
| **Plaid** | `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` | Bank account linking & income verification |
| **Google Places** | `GOOGLE_PLACES_API_KEY` | Address autocomplete |

Without these keys:
- Plaid shows a demo mode with sample data
- Address fields fall back to manual entry

### 5. Start Development Server
```bash
npm run dev
```
App runs at http://localhost:3000 (or next available port)

### 6. Verify Setup
```bash
npm test  # Should pass 149+ tests
```

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Borrower | borrower@demo.com | demo123 |
| Admin | admin@demo.com | admin123 |

---

## Working with Claude Code

This project is optimized for development with Claude Code.

### First Session
1. Open the project in VS Code
2. Open Claude Code panel (`Ctrl+Shift+P` → "Claude Code: Open")
3. Claude automatically reads `CLAUDE.md` for project context

### Key Documentation Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project entry point (Claude reads this first) |
| `TASKS.md` | Task history and status |
| `SESSION.md` | Session notes and quick reference |
| `REQUIREMENTS.md` | Detailed specifications |

### Helpful Prompts
- "Read CLAUDE.md and orient me to the project"
- "What's the status of current tasks?"
- "Help me implement [feature]"
- "Run the tests and fix any failures"

---

## Coding Standards

### TypeScript
- Use TypeScript for all new files
- Define interfaces for props and data structures
- Avoid `any` type - use proper typing

```typescript
// Good
interface ApplicationCardProps {
  app: Application
  onContinue: (id: string) => void
}

// Avoid
const ApplicationCard = (props: any) => { ... }
```

### React Components
- Use functional components with hooks
- Place components in `src/components/`
- Page components go in `src/pages/`
- One component per file

```typescript
// Component structure
export default function ComponentName({ prop1, prop2 }: Props) {
  // Hooks first
  const [state, setState] = useState()

  // Effects
  useEffect(() => { ... }, [])

  // Handlers
  const handleClick = () => { ... }

  // Render
  return ( ... )
}
```

### File Organization
```
src/
├── pages/           # Next.js pages (routes)
│   ├── api/         # API endpoints
│   └── admin/       # Admin-only pages
├── components/      # Reusable React components
│   ├── steps/       # Wizard step forms
│   └── charts/      # Chart components
├── lib/             # Business logic & utilities
│   └── integrations/# Mock API integrations
├── schemas/         # JSON Schema definitions
├── __tests__/       # Unit tests
└── styles/          # Global CSS
```

### API Endpoints
- Place in `src/pages/api/`
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return consistent JSON responses
- Handle errors gracefully

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ... logic
    return res.status(200).json({ data })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Testing
- Write tests for business logic in `src/__tests__/`
- Use Jest and React Testing Library
- Run tests before submitting PRs: `npm test`

---

## Frontend Design Guidelines

We use a distinctive design system. Follow these standards for UI consistency.

### Use Existing Component Classes

We have pre-built Tailwind component classes in `globals.css`. **Use these instead of writing raw Tailwind:**

```tsx
// Good - use component classes
<button className="btn btn-primary">Submit</button>
<div className="card card-hover p-6">Content</div>
<span className="badge badge-approved">Approved</span>

// Avoid - raw Tailwind for common patterns
<button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
```

### Available Component Classes

| Class | Purpose |
|-------|---------|
| `.btn`, `.btn-primary`, `.btn-secondary` | Buttons |
| `.card`, `.card-hover` | Card containers |
| `.badge`, `.badge-draft`, `.badge-approved` | Status badges |
| `.input`, `.input-error` | Form inputs |
| `.label` | Form labels |
| `.alert`, `.alert-success`, `.alert-error` | Alert messages |
| `.stat-card`, `.stat-value`, `.stat-label` | Statistics display |
| `.table-container`, `.table-row`, `.table-cell` | Tables |

### Color Palette

Use our semantic color system:

| Color | Purpose | Example |
|-------|---------|---------|
| `primary-*` | Brand, links, CTAs | `bg-primary-600`, `text-primary-500` |
| `success-*` | Approved, positive | `bg-success-100`, `text-success-800` |
| `warning-*` | Draft, pending | `bg-warning-100`, `text-warning-800` |
| `danger-*` | Denied, errors | `bg-danger-100`, `text-danger-800` |

### Typography
- Font: Inter (loaded via Google Fonts)
- Use Tailwind's text utilities: `text-sm`, `text-lg`, `font-medium`, `font-semibold`

### Design Philosophy

From our frontend-design skill:

1. **Be Bold**: Choose a clear aesthetic direction and execute it with precision
2. **Avoid Generic**: No cookie-cutter designs - make it memorable
3. **Production-Grade**: Code should be functional and polished
4. **Cohesive**: Maintain visual consistency across the app
5. **Refined Details**: Pay attention to spacing, shadows, transitions

### What to Avoid
- Generic AI aesthetics (overused gradients, predictable layouts)
- Inconsistent spacing or colors
- Missing hover/focus states
- Raw Tailwind when component classes exist

---

## Submitting Changes

### Branch Naming
```
feature/description   # New features
fix/description       # Bug fixes
docs/description      # Documentation
```

### Commit Messages
```
Add borrower dashboard with application list
Fix sign-out redirect to use current origin
Update README with new features
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**
   - Follow coding standards above
   - Write tests for new logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm test
   npm run dev  # Manual testing
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add feature description"
   git push origin feature/my-feature
   ```

5. **Open a Pull Request**
   - Describe what changed and why
   - Reference any related issues
   - Include screenshots for UI changes

### PR Checklist
- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors
- [ ] UI matches design system
- [ ] Documentation updated (if applicable)
- [ ] Tested manually in browser

---

## Technical Constraints

Be aware of these pinned versions:

| Package | Version | Reason |
|---------|---------|--------|
| Prisma | 5.22.0 | v7+ has breaking changes |
| Tailwind CSS | 3.4.19 | v4 has breaking changes |

Other notes:
- SQLite stores JSON as strings (API handles serialization)
- `postcss.config.js` is required for Tailwind
- Sign-in/out uses `window.location.origin` for port flexibility

---

## Task Management

We use `.claude/tasks/` to track detailed task specifications.

### Task Lifecycle
1. **Create**: New tasks go in `.claude/tasks/TASK-ID.md`
2. **Work**: Update status to `in_progress` while working
3. **Complete**: Mark status as `DONE` in the file
4. **Archive**: Move completed tasks to `.claude/tasks/archive/`

### Folder Structure
```
.claude/tasks/
├── NEW-TASK.md        # Active/pending tasks
├── archive/           # Completed tasks (for reference)
│   ├── DASH-01.md
│   └── ...
```

This keeps the main folder clean while preserving specs for future reference.

---

## Questions?

- Check `CLAUDE.md` for project overview
- Read `TASKS.md` for completed work history
- Open an issue for bugs or feature requests
