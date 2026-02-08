import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import UserMenu from '../../components/UserMenu'
import PriorityBadge from '../../components/PriorityBadge'
import SLABadge from '../../components/SLABadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-primary-100 text-primary-800',
  in_review: 'bg-purple-100 text-purple-800',
  pending_documents: 'bg-orange-100 text-orange-800',
  approved: 'bg-success-100 text-success-800',
  denied: 'bg-danger-100 text-danger-800'
}

export default function CaseworkerDashboard() {
  const { data: session } = useSession()
  const user = session?.user as any
  const { data: queue, error: queueError } = useSWR('/api/caseworker/queue', fetcher)
  const { data: stats } = useSWR('/api/caseworker/stats', fetcher)
  const { data: history, error: historyError } = useSWR('/api/caseworker/history?limit=10', fetcher)
  const [historyPage, setHistoryPage] = useState(1)

  function getBorrowerName(app: any): string {
    const b = app.borrowers?.[0]
    if (!b?.name) return 'Unknown'
    return `${b.name.firstName || ''} ${b.name.lastName || ''}`.trim() || 'Unknown'
  }

  function getLoanAmount(app: any): string {
    const amount = app.data?.loan?.loanAmount
    return amount ? `$${amount.toLocaleString()}` : '-'
  }

  function getPropertyInfo(app: any): string {
    const addr = app.data?.property?.address
    if (!addr) return '-'
    return `${addr.city || ''}, ${addr.state || ''}`.trim() || '-'
  }

  function getDaysInQueue(app: any): number {
    const assigned = app.assignedAt ? new Date(app.assignedAt) : new Date(app.createdAt)
    return Math.floor((Date.now() - assigned.getTime()) / 86400000)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">MortMortgage</span>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-medium text-gray-600">My Queue</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Bar */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Caseworker'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{today}</p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card border-l-4 border-primary-500">
              <div className="stat-value text-primary-600">{stats.queueCount}</div>
              <div className="stat-label">Active Queue</div>
            </div>
            <div className="stat-card border-l-4 border-success-500">
              <div className="stat-value text-success-600">{stats.completedThisMonth}</div>
              <div className="stat-label">Completed This Month</div>
            </div>
            <div className="stat-card border-l-4 border-purple-500">
              <div className="stat-value text-purple-600">{stats.avgDaysToDecision}</div>
              <div className="stat-label">Avg Days to Decision</div>
            </div>
            <div className="stat-card border-l-4 border-orange-500">
              <div className="stat-value text-orange-600">{stats.approvalRate}%</div>
              <div className="stat-label">Approval Rate</div>
            </div>
          </div>
        )}

        {/* Active Queue */}
        <div className="card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Queue</h2>
            <p className="text-sm text-gray-500">Sorted by priority, SLA urgency, then age</p>
          </div>

          {queueError && (
            <div className="p-6 text-center text-red-600">Failed to load queue</div>
          )}

          {!queue && !queueError && (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading queue...
              </div>
            </div>
          )}

          {queue && queue.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Queue is empty!</h3>
              <p className="text-gray-500">No active applications assigned to you.</p>
            </div>
          )}

          {queue && queue.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Priority</th>
                    <th className="table-header-cell">Borrower</th>
                    <th className="table-header-cell">Loan Amount</th>
                    <th className="table-header-cell">Property</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Days</th>
                    <th className="table-header-cell">SLA</th>
                    <th className="table-header-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((app: any) => (
                    <tr key={app.id} className="table-row">
                      <td className="table-cell">
                        <PriorityBadge priority={app.priority} />
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{getBorrowerName(app)}</div>
                        <div className="text-xs text-gray-500 font-mono">{app.id.slice(0, 8)}...</div>
                      </td>
                      <td className="table-cell font-semibold text-gray-900">
                        {getLoanAmount(app)}
                      </td>
                      <td className="table-cell text-gray-600">{getPropertyInfo(app)}</td>
                      <td className="table-cell">
                        <span className={`badge ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">{getDaysInQueue(app)}</td>
                      <td className="table-cell">
                        <SLABadge deadline={app.slaDeadline} />
                      </td>
                      <td className="table-cell">
                        <Link href={`/admin/apps/${app.id}`} className="btn btn-sm btn-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Completed History */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Completed History</h2>
            <p className="text-sm text-gray-500">Your recently decided applications</p>
          </div>

          {historyError && (
            <div className="p-6 text-center text-red-600">Failed to load history</div>
          )}

          {!history && !historyError && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}

          {history && history.items?.length === 0 && (
            <div className="p-8 text-center text-gray-500">No completed applications yet.</div>
          )}

          {history && history.items?.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Borrower</th>
                      <th className="table-header-cell">Loan Amount</th>
                      <th className="table-header-cell">Outcome</th>
                      <th className="table-header-cell">Decision Date</th>
                      <th className="table-header-cell">Days to Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.items.map((app: any) => {
                      const daysToDecision = app.assignedAt
                        ? Math.floor((new Date(app.updatedAt).getTime() - new Date(app.assignedAt).getTime()) / 86400000)
                        : '-'
                      return (
                        <tr key={app.id} className="table-row">
                          <td className="table-cell">
                            <div className="font-medium text-gray-900">{getBorrowerName(app)}</div>
                          </td>
                          <td className="table-cell font-semibold">{getLoanAmount(app)}</td>
                          <td className="table-cell">
                            <span className={`badge ${app.status === 'approved' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="table-cell text-gray-500">
                            {new Date(app.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="table-cell text-gray-600">{daysToDecision}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {history.total > history.limit && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Page {history.page} of {Math.ceil(history.total / history.limit)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className="btn btn-sm btn-ghost disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setHistoryPage(p => p + 1)}
                      disabled={historyPage >= Math.ceil(history.total / history.limit)}
                      className="btn btn-sm btn-ghost disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center">
          Demo application. All data is synthetic for presentation purposes only.
        </p>
      </div>
    </main>
  )
}
