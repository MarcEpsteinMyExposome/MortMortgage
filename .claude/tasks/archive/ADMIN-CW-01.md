# ADMIN-CW-01: Caseworker Queues & Supervisor Dashboards

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | ADMIN-CW-01 |
| **Title** | Caseworker Queues & Supervisor Dashboards |
| **Status** | TODO |
| **Priority** | High |
| **Estimated Complexity** | High |
| **Dependencies** | None |
| **Branch** | `feature/admin-caseworker-queues` |

---

## Description

Add caseworker management, per-worker work queues, and supervisor oversight dashboards to the admin section. This transforms the flat application list into an organized workflow system with:
- Multiple caseworker users assigned to mortgage applications
- Individual work queues with priority and SLA tracking
- Caseworker "workbench" dashboards showing current queue and historical results
- Supervisor dashboards with workload distribution, per-worker performance, and LTV/DTI risk analysis
- Rich mock seed data for polished demo experience

---

## Requirements

### Functional Requirements

1. **Caseworker Management**
   - Define caseworker users (4 demo caseworkers seeded)
   - Create/deactivate caseworkers via admin page
   - Caseworkers have their own login and navigation

2. **Work Queue System**
   - Applications assigned to caseworkers (manual + auto-assign)
   - Queue sorted by priority (urgent → high → normal → low), SLA deadline, then age
   - SLA tracking: on_track / at_risk / overdue badges
   - Priority levels: urgent (red), high (orange), normal (blue), low (gray)

3. **Caseworker Dashboard**
   - Stats: active queue count, completed this month, avg days to decision, approval rate
   - Active queue table with priority dots, SLA badges, borrower/loan details
   - Completed history with outcome badges, paginated

4. **Supervisor Dashboard**
   - Overview: total open, unassigned, overdue, team approval rate, avg days
   - Workload distribution bar chart per caseworker
   - Performance table with approval rate bars
   - LTV/DTI stacked bar charts (approved vs denied by range, per worker)
   - 6-month performance trend line chart
   - Recent assignment activity feed
   - Auto-assign button for unassigned applications

5. **Seed Data**
   - 30-40 applications with realistic distributions
   - Uneven caseworker assignment for interesting visualizations
   - LTV/DTI patterns that show in charts
   - Assignment audit trail records

### Non-Functional Requirements
- Follow existing Tailwind/SWR/recharts patterns
- All new API routes protected with withAuth
- Existing tests must continue passing
- Demo-friendly: all features work with seeded data

---

## Acceptance Criteria

- [ ] 4 demo caseworkers + 1 supervisor in auth system
- [ ] Caseworker can sign in and see their assigned queue
- [ ] Queue shows priority, SLA status, days in queue
- [ ] Caseworker sees historical results with approval rate
- [ ] Supervisor sees workload distribution across team
- [ ] Supervisor sees LTV/DTI approval analysis charts
- [ ] Supervisor can auto-assign unassigned applications
- [ ] Admin portal shows assigned caseworker column
- [ ] Seed data populates all dashboards with realistic data
- [ ] All existing + new tests pass
- [ ] Production build succeeds

---

## Implementation Phases

### Phase 1: Database & Auth Foundation
- Prisma schema updates + migration
- Role hierarchy in auth.ts
- Demo users in NextAuth config
- UserMenu navigation updates

### Phase 2: API Routes
- Caseworker queue/history/stats endpoints
- Assignment CRUD + auto-assign
- Caseworker management CRUD
- Supervisor analytics endpoint
- Modify existing apps API for assignment filters

### Phase 3: Shared Components
- PriorityBadge, SLABadge, CaseworkerSelect, AssignmentPanel
- WorkloadBarChart, LTVDTIStackedChart, PerformanceTrendChart, ApprovalRateBar

### Phase 4: Caseworker Dashboard Page
- /caseworker with queue table + history

### Phase 5: Supervisor Dashboard + Admin Updates
- /supervisor with full analytics
- /admin/caseworkers management page
- Admin portal assignment column + assign button

### Phase 6: Seed Data & Polish
- Generate 30-40 realistic applications
- Assignment history records
- Loading/error states, tests, docs

---

## New Demo Accounts

| Role | Email | Password | Name |
|------|-------|----------|------|
| Supervisor | supervisor@demo.com | demo123 | Maria Rodriguez |
| Caseworker | caseworker1@demo.com | demo123 | Sarah Chen |
| Caseworker | caseworker2@demo.com | demo123 | James Wilson |
| Caseworker | caseworker3@demo.com | demo123 | Priya Patel |
| Caseworker | caseworker4@demo.com | demo123 | Marcus Johnson |
