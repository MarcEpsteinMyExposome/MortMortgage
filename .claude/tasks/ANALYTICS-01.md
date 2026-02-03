# ANALYTICS-01: Admin Analytics Dashboard

## Overview
| Field | Value |
|-------|-------|
| **Task ID** | ANALYTICS-01 |
| **Title** | Admin Analytics Dashboard |
| **Status** | DONE |
| **Priority** | Medium |
| **Estimated Complexity** | Medium |
| **Dependencies** | None |

---

## Description

Create an `/admin/analytics` page with charts and metrics for administrators to understand application trends, volume, and processing performance. This is a read-only dashboard that visualizes existing application data.

---

## Requirements

### Functional Requirements

1. **Summary Metrics (Top Row)**
   - Total applications (all time)
   - Applications this month
   - Approval rate (approved / total decided)
   - Average loan amount

2. **Application Volume Chart**
   - Line or bar chart showing applications over time
   - Group by week or month
   - Show last 6 months of data

3. **Status Distribution**
   - Pie or donut chart showing current status breakdown
   - Draft, Submitted, In Review, Approved, Denied

4. **Loan Type Breakdown**
   - Bar chart: Conventional vs FHA
   - Include average loan amount per type

5. **Property Type Distribution**
   - Horizontal bar chart: SFR, Condo, Multi-unit, etc.

6. **Recent Activity Feed**
   - Last 10 application status changes
   - Show: App ID, old status → new status, timestamp

### Non-Functional Requirements

- Admin authentication required
- Charts should be responsive
- Use a lightweight charting library (Chart.js or Recharts)
- Loading states for data fetching

---

## Acceptance Criteria

- [ ] Page accessible at `/admin/analytics` for admin users only
- [ ] Non-admin users redirected or shown access denied
- [ ] Summary metrics display accurately
- [ ] Volume chart shows applications over time
- [ ] Status pie chart reflects current data
- [ ] All charts render correctly on mobile
- [ ] Page handles empty data gracefully (no applications yet)
- [ ] Loading states display while fetching

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/analytics.tsx` | Main analytics dashboard page |
| `src/pages/api/admin/analytics.ts` | API endpoint for aggregated stats |
| `src/components/charts/StatusPieChart.tsx` | Pie chart component |
| `src/components/charts/VolumeChart.tsx` | Line/bar chart component |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/index.tsx` | Add "Analytics" link/button |
| `package.json` | Add chart library (recharts or chart.js) |

---

## Technical Notes

### Recommended Chart Library

**Recharts** (recommended for React):
```bash
npm install recharts
```

```typescript
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis } from 'recharts'
```

### API Response Shape

```typescript
// GET /api/admin/analytics
interface AnalyticsResponse {
  summary: {
    totalApplications: number
    thisMonth: number
    approvalRate: number  // 0-100
    avgLoanAmount: number
  }
  volumeByMonth: Array<{
    month: string  // "2026-01"
    count: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
  }>
  loanTypeBreakdown: Array<{
    type: string  // "Conventional" | "FHA"
    count: number
    avgAmount: number
  }>
  propertyTypeBreakdown: Array<{
    type: string
    count: number
  }>
  recentActivity: Array<{
    appId: string
    timestamp: string
    change: string  // "draft → submitted"
  }>
}
```

### Database Queries (Prisma)

```typescript
// Total applications
const total = await prisma.application.count()

// This month
const thisMonth = await prisma.application.count({
  where: {
    createdAt: { gte: startOfMonth(new Date()) }
  }
})

// Status distribution
const byStatus = await prisma.application.groupBy({
  by: ['status'],
  _count: true
})

// Note: For volume over time, may need raw SQL or
// fetch all and aggregate in JS for SQLite
```

### Color Palette for Charts

```typescript
const STATUS_COLORS = {
  draft: '#6B7280',      // gray
  submitted: '#3B82F6',  // blue
  in_review: '#F59E0B',  // yellow
  approved: '#10B981',   // green
  denied: '#EF4444'      // red
}
```

### Admin Auth Check

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }
  return { props: {} }
}
```

---

## Testing

### Manual Testing
1. Sign in as admin@demo.com
2. Navigate to /admin/analytics
3. Verify all charts render with data
4. Test with various screen sizes
5. Sign in as borrower, verify access denied

### Unit Tests (Optional)
- Test analytics API aggregation logic
- Test chart components with mock data

---

## Design Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics Dashboard                                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │    47    │ │    12    │ │   73%    │ │  $385K   │           │
│  │  Total   │ │This Month│ │ Approval │ │ Avg Loan │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Application Volume                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │     📊 [Line chart showing monthly volume]               │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
├───────────────────────────────┬─────────────────────────────────┤
│  Status Distribution          │  Loan Types                     │
│  ┌─────────────────────┐     │  ┌─────────────────────────┐   │
│  │    🥧 [Pie chart]    │     │  │ Conv ████████████ 35   │   │
│  │                      │     │  │ FHA  ██████ 12         │   │
│  └─────────────────────┘     │  └─────────────────────────┘   │
├───────────────────────────────┴─────────────────────────────────┤
│  Recent Activity                                                 │
│  • App #1234: draft → submitted (2 hours ago)                   │
│  • App #1233: submitted → approved (5 hours ago)                │
│  • App #1232: submitted → denied (1 day ago)                    │
└─────────────────────────────────────────────────────────────────┘
```
