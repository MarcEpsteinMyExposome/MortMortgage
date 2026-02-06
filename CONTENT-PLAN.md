# MortMortgage Content Plan: Blog + Video Tutorial

> How I built a 22-feature mortgage platform in 4 days using Claude Code

---

## Your Story in One Sentence

**A solo developer used Claude Code to build a production-grade mortgage application system — 22 features, 310+ tests, 60+ files — in 4 working days.**

That's the headline. Everything below serves that story.

---

## Part 1: Content Strategy (What to Make)

You're producing two pieces of content that reinforce each other:

| Piece | Format | Length | Purpose |
|-------|--------|--------|---------|
| **Blog post** | Written tutorial with screenshots | 2,000-3,000 words | SEO, shareability, detailed reference |
| **Video** | Screen recording with narration | 8-15 minutes | Engagement, proof it's real, personality |

The blog links to the video. The video description links to the blog. Both link to the GitHub repo.

---

## Part 2: High-Level Outline (The 8 Beats)

1. **The Hook** — What you built and how fast
2. **The Problem** — Why mortgage software is hard (regulations, compliance, URLA)
3. **Day 1 Sprint** — Foundation: schema, wizard, API, auth, admin (8 features)
4. **Day 2 Sprint** — Polish: integrations, PDF export, UI refresh, tests, 4 tools built in parallel
5. **Day 3 Sprint** — Advanced: Plaid, address autocomplete, co-borrower (3 features in parallel)
6. **Day 4 Sprint** — AI & finishing: OCR, signatures, maps, CI/CD, architecture plan
7. **The Results** — Walk through the live app, show the numbers
8. **Lessons Learned** — What worked, what surprised you, advice for others

---

## Part 3: Detailed Blog Outline

### Beat 1: The Hook (200 words)

**Title options** (pick one):
- "I Built a 22-Feature Mortgage Platform in 4 Days with Claude Code"
- "From Zero to Production Mortgage App: 4 Days with an AI Coding Partner"
- "How Claude Code Helped Me Build What Would Take a Team Months"

**Opening paragraph formula:**
- State the result (22 features, 310+ tests, full URLA compliance)
- State the timeline (4 working days, Feb 2-5)
- State the twist (solo developer, no team, no boilerplate starter)

**Include:**
- Feature count badge/graphic
- Link to live demo or GitHub repo
- Screenshot of the finished app (home page or admin dashboard)

---

### Beat 2: The Problem (300 words)

Explain why this is impressive by explaining what mortgage software requires:

- **URLA 2020** — The Uniform Residential Loan Application has 10 sections, hundreds of fields, and strict regulatory requirements
- **MISMO v3.4** — The industry data exchange standard that every lender system expects
- **Compliance** — HMDA demographics, declaration questions, SSN handling
- **Integration surface** — Credit bureaus, income verification, property valuation, pricing engines, bank linking, document OCR, e-signatures

**Key stat to include:** "A typical mortgage LOS (Loan Origination System) takes teams of 10-20 engineers 12-18 months to build."

**Screenshot:** The 10-step wizard showing all URLA sections

---

### Beat 3: Day 1 — The Foundation (400 words)

**Date:** February 2, 2026
**Features built:** 8

Tell the story chronologically. For each feature, describe:
- What you asked Claude to do (the prompt, paraphrased)
- What Claude produced
- How long it took (approximate)

| Order | Feature | What it is |
|-------|---------|------------|
| 1 | DM-1: URLA Schema | 10 JSON schemas covering every URLA section |
| 2 | FE-01: Wizard | 10-step form with auto-save and progress tracking |
| 3 | BE-01: CRUD API | Full REST API for applications |
| 4 | DM-2: MISMO Export | URLA-to-MISMO mapping with JSON + XML output |
| 5 | ADMIN-01: Admin Portal | Application management dashboard |
| 6 | FE-02: Validation | DTI/LTV checks with real-time warnings |
| 7 | AUTH-01: Auth | NextAuth.js with demo accounts |
| 8 | DOC-01: Documents | File upload with type categorization |

**Screenshot:** The application wizard mid-way through (show the step indicator)

**Key talking point:** "I didn't write a single line of the Prisma schema by hand. I described what a mortgage application needs to store, and Claude generated the data model, the API, and the form — all connected."

---

### Beat 4: Day 2 — Polish & Parallel Builds (400 words)

**Date:** February 3, 2026
**Features built:** 8 (including 4 built in parallel)

This is where the story gets interesting. Morning was sequential work:

| Order | Feature | Highlight |
|-------|---------|-----------|
| 1 | INTEG-01: Mock Integrations | Credit pulls, income verification, AVM, pricing — all with deterministic test scenarios |
| 2 | PDF-01: URLA PDF | Full PDF generation with SSN masking |
| 3 | UI-01: Design Refresh | Complete visual overhaul with custom Tailwind theme |
| 4 | TEST-02: Test Expansion | Went from 26 to 147 tests |

Then afternoon — **4 features in parallel using Claude Code agents:**

| Agent | Feature | Page |
|-------|---------|------|
| Agent 1 | Borrower Dashboard | `/dashboard` |
| Agent 2 | Pre-Qualification Calculator | `/prequalify` |
| Agent 3 | Admin Analytics | `/admin/analytics` |
| Agent 4 | Loan Comparison Tool | `/compare` |

**Screenshot:** Side-by-side of the 4 pages that were built simultaneously

**Key talking point:** "I launched 4 Claude agents in parallel. Each one built a complete page — component, API endpoint, business logic, and tests — independently. All 4 merged cleanly."

---

### Beat 5: Day 3 — Advanced Integrations (300 words)

**Date:** February 4, 2026
**Features built:** 3 (all in parallel)

| Agent | Feature | Complexity |
|-------|---------|------------|
| Agent 1 | Google Places Autocomplete | Custom component + API proxy + keyboard nav |
| Agent 2 | Plaid Bank Linking | Token exchange, account display, income verification |
| Agent 3 | Co-Borrower UI | Tab-based switching across 3 wizard steps |

**Screenshot:** The employment form showing Plaid connection + verified income

**Key talking point:** "Each integration required 4-6 new files, a component, an API proxy, and careful error handling. Claude produced all of it from a task description."

---

### Beat 6: Day 4 — AI Features & Production Readiness (300 words)

**Date:** February 5, 2026
**Features built:** 5+

| Feature | What it does |
|---------|-------------|
| INTEG-04: AI Document OCR | Claude Vision + Tesseract.js fallback for W2/paystub/bank statement extraction |
| INTEG-05: Signature Pad | Touch-friendly canvas with PDF embedding |
| MAP-01: Property Map | Leaflet map with comparable sales pins |
| UX-02: UX Polish | Stepper scroll fix, auto-save indicator, toast notifications |
| CI/CD | GitHub Actions, architecture plan for future refactoring |

**Screenshot:** The admin panel showing OCR extraction results with confidence scores

**Key talking point:** "By day 4, I was asking Claude to build AI features on top of AI infrastructure. Claude Code wrote the code that calls Claude's Vision API to read mortgage documents. Meta."

---

### Beat 7: The Results (300 words)

Walk through the final product with numbers:

| Metric | Value |
|--------|-------|
| Features shipped | 22 |
| Source files created | 60+ |
| Unit tests | 310+ |
| JSON schemas | 11 |
| API endpoints | 15+ |
| React components | 25+ |
| Lines of code | ~15,000+ (estimate) |
| Working days | 4 |

**Include a feature tour** — brief description of each page with a screenshot:
1. Home page (hero + features)
2. Pre-qualification calculator
3. Loan comparison tool
4. 10-step wizard (pick 2-3 steps to show)
5. Borrower dashboard
6. Admin portal (list view)
7. Admin detail (underwriting panel + map)
8. Analytics dashboard

**Key talking point:** "This isn't a toy. It has URLA 2020 compliance, MISMO v3.4 export, real Plaid integration, AI document processing, and 310 tests. It's a demo, but the architecture is production-grade."

---

### Beat 8: Lessons Learned (300 words)

Share honest takeaways:

1. **Describe the outcome, not the code** — Claude works best when you say "build a pre-qualification calculator that shows max loan amount based on DTI" rather than "create a React component with useState hooks"

2. **Parallel agents are a superpower** — Building 4 independent features simultaneously felt like having a team. Each agent maintained its own context and produced clean, mergeable code.

3. **Let Claude handle the boring parts** — Schema definitions, form field mapping, test boilerplate, MISMO XML generation — these are tedious for humans and trivial for AI.

4. **Keep a project file (CLAUDE.md)** — This was essential. It gave Claude context about the full system so each new feature fit into the existing architecture.

5. **Fix bugs by describing symptoms** — "The OCR results show 612 individual characters instead of field names" was enough for Claude to find the SQLite JSON parsing bug.

6. **Know when to plan vs. just build** — Simple features: just ask. Complex refactors (like the architecture overhaul): ask Claude to plan first, review the plan, then execute.

---

## Part 4: Video Production Guide

### Equipment & Software

**Minimum setup (free):**

| Need | Tool | Notes |
|------|------|-------|
| Screen recording | **OBS Studio** (free) | [obsproject.com](https://obsproject.com/) — record screen + mic |
| Editing | **DaVinci Resolve** (free) | [blackmagicdesign.com](https://www.blackmagicdesign.com/products/davinciresolve/) — professional editor, free tier is excellent |
| Thumbnails | **Canva** (free) | [canva.com](https://www.canva.com/) — for blog header images and video thumbnails |
| Screenshots | **Windows Snipping Tool** | `Win + Shift + S` — built into Windows |

**Better setup (if you want to invest):**

| Need | Tool | Cost |
|------|------|------|
| Screen recording | **Camtasia** | ~$250 one-time |
| Mic | **Blue Yeti** or **Rode NT-USB Mini** | $50-100 |
| Editing | **Premiere Pro** or DaVinci Resolve | $20/mo or free |

### OBS Studio Setup (Step by Step)

1. **Download & install** OBS from [obsproject.com](https://obsproject.com/)
2. **Create a Scene** called "MortMortgage Demo"
3. **Add sources:**
   - "Display Capture" or "Window Capture" (VS Code)
   - "Audio Input Capture" (your microphone)
4. **Settings > Output:**
   - Recording Path: choose a folder with space (videos are large)
   - Recording Format: `mkv` (crash-safe) — remux to `mp4` after recording
   - Encoder: leave default (x264 or NVENC if you have NVIDIA)
5. **Settings > Video:**
   - Base Resolution: `1920x1080`
   - Output Resolution: `1920x1080`
   - FPS: `30`
6. **Settings > Audio:**
   - Sample Rate: 48kHz
   - Mic: select your microphone
7. **Test recording:** Record 10 seconds, play it back, check audio levels

**After recording:** File > Remux Recordings > convert `.mkv` to `.mp4`

### Video Structure (Script Outline)

**Target length: 10-12 minutes**

| Timestamp | Section | What to show on screen | Duration |
|-----------|---------|----------------------|----------|
| 0:00 | **Hook** | Final app running — quick montage of pages | 30 sec |
| 0:30 | **Intro** | You talking to camera or over title slide | 30 sec |
| 1:00 | **The Challenge** | URLA form PDF on screen, explain complexity | 1 min |
| 2:00 | **Project Setup** | VS Code + Claude Code panel open, show CLAUDE.md | 1 min |
| 3:00 | **Day 1 Demo** | Speed through: schema → wizard → API → admin | 2 min |
| 5:00 | **Parallel Build** | Show launching 4 agents, then the 4 resulting pages | 2 min |
| 7:00 | **Advanced Features** | Plaid, OCR, property map — real interactions | 2 min |
| 9:00 | **Test Suite** | Run `npm test`, show 310+ tests passing | 30 sec |
| 9:30 | **Results Recap** | Feature count, stats, what impressed you | 1 min |
| 10:30 | **Lessons + CTA** | Key takeaways, link to blog, subscribe | 1 min |

### Recording Tips

1. **Record in segments, not one take.** Record each "beat" separately. Edit them together. This is much less stressful and produces better content.

2. **Zoom in when showing code.** Your viewers are watching on phones. Use `Ctrl + =` in VS Code to bump font size to 18-20px before recording.

3. **Use a clean VS Code profile.** Hide distracting extensions, use a clean theme (Dark+ or One Dark Pro). Close unrelated tabs.

4. **Pre-stage your demo.** Before recording each segment:
   - Have the right files already open
   - Have the browser on the right page
   - Clear your terminal
   - Make sure the dev server is running

5. **Speed up boring parts in editing.** `npm install` and build steps should be sped up 4-8x. Nobody wants to watch packages install.

6. **Show the Claude Code panel.** The star of the video is the interaction between you and Claude. Make sure the Claude panel is visible and readable.

7. **Record audio separately if possible.** Even recording narration in a quiet room after the fact (voiceover) sounds much better than live narration with keyboard clicks.

### Screen Layout for Recording

```
+-----------------------------------------------+
|  VS Code (left 60%)    |  Browser (right 40%)  |
|                         |                       |
|  - Editor/Terminal      |  - App running at     |
|  - Claude Code panel    |    localhost:3000      |
|    visible at bottom    |                       |
|    or right side        |                       |
+-----------------------------------------------+
```

For code-focused segments, go full-screen VS Code.
For demo-focused segments, go full-screen browser.
For "watch Claude work" segments, use the split layout.

---

## Part 5: Blog Post Production Guide

### Where to Publish

| Platform | Pros | How to post |
|----------|------|-------------|
| **Dev.to** | Developer audience, built-in distribution, free | [dev.to/enter](https://dev.to/enter) — paste markdown directly |
| **Hashnode** | Custom domain, newsletter built-in, free | [hashnode.com](https://hashnode.com/) — paste markdown |
| **Medium** | Large general audience | [medium.com/new-story](https://medium.com/new-story) — paste formatted text |
| **LinkedIn article** | Professional network, good for brand | LinkedIn > "Write article" |
| **Personal blog** | Full control | If you have one, cross-post from there |

**Recommendation:** Publish on **Dev.to** first (biggest developer audience), then cross-post to LinkedIn and Medium a few days later.

### Screenshot Checklist

Capture these before you start writing. Use `Win + Shift + S` on Windows.

| # | Screenshot | Where to capture |
|---|-----------|-----------------|
| 1 | Home page (hero section) | `/` |
| 2 | Sign-in page | `/auth/signin` |
| 3 | Borrower dashboard with applications | `/dashboard` |
| 4 | Pre-qualification calculator with results | `/prequalify` |
| 5 | Loan comparison (3 scenarios) | `/compare` |
| 6 | Wizard step 1 (Identity) | `/apply/[id]` |
| 7 | Wizard step with address autocomplete | `/apply/[id]` step 2 |
| 8 | Wizard step with Plaid connected | `/apply/[id]` step 3 |
| 9 | Wizard step with document upload + OCR results | `/apply/[id]` step 10 |
| 10 | Admin portal (list view) | `/admin` |
| 11 | Admin detail with underwriting results | `/admin/apps/[id]` |
| 12 | Admin analytics charts | `/admin/analytics` |
| 13 | Property map with comparable pins | `/admin/apps/[id]` (after AVM) |
| 14 | VS Code with Claude Code panel open | Your IDE |
| 15 | Terminal showing 310+ tests passing | `npm test` output |

**Tip:** Use demo data that looks realistic. Fill in the wizard with a plausible name/address before screenshotting.

### Writing Tips

1. **Start with the result, not the process.** "Here's what I built" before "Here's how I built it."

2. **Use screenshots every 200-300 words.** Walls of text lose readers. Each "beat" should have at least one image.

3. **Include real prompts.** Show what you actually typed into Claude Code. Readers want to know the "how."

4. **Be honest about rough edges.** Mention bugs you hit (the OCR character-by-character bug, the Tailwind v4 issue). It makes the story credible.

5. **End with a call to action.** Link to the repo, invite people to clone it and try Claude Code themselves.

### Blog Post Template

Use this as your starting skeleton (fill in your own words):

```markdown
# [Title]

[1-2 sentence hook + hero screenshot]

## What I Built

[Feature summary — the 22 features, link to FEATURES.md]
[Screenshot: home page]

## Why Mortgage Software Is Hard

[Explain URLA, MISMO, compliance — the context that makes this impressive]

## Day 1: Foundation (8 Features)

[Story + screenshots of wizard and admin]

## Day 2: Going Parallel (8 Features)

[Story + screenshot of 4 parallel pages]

## Day 3: Integrations (3 Features)

[Story + screenshot of Plaid/autocomplete]

## Day 4: AI and Polish (5+ Features)

[Story + screenshot of OCR results]

## The Final Numbers

[Stats table + test screenshot]

## What I Learned

[6 lessons from above]

## Try It Yourself

[Link to repo + link to GETTING-STARTED.md]
```

---

## Part 6: Promotion Checklist

After publishing, share your content:

- [ ] Post blog link on Twitter/X with 2-3 screenshots
- [ ] Post on LinkedIn with a short summary
- [ ] Share in relevant subreddits (r/programming, r/nextjs, r/artificial)
- [ ] Share on Hacker News (use a factual title, no hype)
- [ ] Post in Claude/Anthropic Discord or community forums
- [ ] Upload video to YouTube with descriptive title and tags
- [ ] Add video link to blog post
- [ ] Add blog link to video description
- [ ] Update your GitHub repo README with links to both

### Hashtags / Tags

For social media and blog platforms:
`#ClaudeCode` `#AI` `#CodingWithAI` `#NextJS` `#TypeScript` `#BuildInPublic` `#Mortgage` `#FinTech` `#WebDev` `#AIProgramming`

---

## Part 7: Timeline to Ship This Content

| Day | Task |
|-----|------|
| **Day 1** | Capture all 15 screenshots. Seed the app with good-looking demo data first. |
| **Day 1** | Write the blog post draft (use the template above). |
| **Day 2** | Record video segments (1 segment per beat, ~8 recordings). |
| **Day 2** | Edit video: trim dead air, speed up installs, add chapter markers. |
| **Day 3** | Review blog, add screenshots, proofread. |
| **Day 3** | Export video, create thumbnail, write description. |
| **Day 4** | Publish blog. Upload video. Cross-post and promote. |

---

## Reference: Project Files for Content

These existing files in your repo have useful content to pull from:

| File | Use it for |
|------|-----------|
| [`FEATURES.md`](FEATURES.md) | Feature descriptions (non-technical language already written) |
| [`TASKS.md`](TASKS.md) | Build timeline and task history |
| [`SESSION.md`](SESSION.md) | Day-by-day session logs (your build diary) |
| [`CLAUDE.md`](CLAUDE.md) | Tech stack, architecture, file map |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup instructions, coding standards |
| [`GETTING-STARTED.md`](GETTING-STARTED.md) | Clone-to-running guide (link in blog for readers who want to try) |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Proof of CI/CD |

Your `SESSION.md` is essentially a build diary — it has the day-by-day narrative already written. Use it as your primary source when writing the blog.
