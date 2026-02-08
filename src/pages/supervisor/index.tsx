import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import UserMenu from '../../components/UserMenu'
import ApprovalRateBar from '../../components/charts/ApprovalRateBar'

const WorkloadBarChart = dynamic(() => import('../../components/charts/WorkloadBarChart'), { ssr: false })
const LTVDTIStackedChart = dynamic(() => import('../../components/charts/LTVDTIStackedChart'), { ssr: false })
const PerformanceTrendChart = dynamic(() => import('../../components/charts/PerformanceTrendChart'), { ssr: false })

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SupervisorDashboard() {
  const { data, error, mutate } = useSWR('/api/supervisor/analytics', fetcher)
  const [autoAssigning, setAutoAssigning] = useState(false)

  async function handleAutoAssign() {
    setAutoAssigning(true)
    try {
      const res = await fetch('/api/admin/assignments/auto-assign', { method: 'POST' })
      const result = await res.json()
      alert(result.message || `Assigned ${result.assigned} applications`)
      mutate()
    } catch (err) {
      alert('Auto-assign failed')
    } finally {
      setAutoAssigning(false)
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load supervisor dashboard</p>
          <Link href="/" className="btn btn-primary">Go Home</Link>
        </div>
      </main>
    )
  }

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
              <span className="text-sm font-medium text-gray-600">Supervisor Dashboard</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading supervisor dashboard...
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="stat-card border-l-4 border-primary-500">
                <div className="stat-value text-primary-600">{data.overview.totalOpen}</div>
                <div className="stat-label">Total Open</div>
              </div>
              <div className="stat-card border-l-4 border-warning-500">
                <div className="stat-value text-warning-600">{data.overview.unassigned}</div>
                <div className="stat-label">Unassigned</div>
              </div>
              <div className="stat-card border-l-4 border-danger-500">
                <div className="stat-value text-danger-600">{data.overview.overdue}</div>
                <div className="stat-label">Overdue SLA</div>
              </div>
              <div className="stat-card border-l-4 border-success-500">
                <div className="stat-value text-success-600">{data.overview.teamApprovalRate}%</div>
                <div className="stat-label">Team Approval Rate</div>
              </div>
              <div className="stat-card border-l-4 border-purple-500">
                <div className="stat-value text-purple-600">{data.overview.avgDaysToDecision}</div>
                <div className="stat-label">Avg Days to Decision</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleAutoAssign}
                disabled={autoAssigning || data.overview.unassigned === 0}
                className="btn btn-primary disabled:opacity-50"
              >
                {autoAssigning ? 'Assigning...' : `Auto-Assign (${data.overview.unassigned} unassigned)`}
              </button>
              <Link href="/admin/caseworkers" className="btn btn-ghost">
                Manage Caseworkers
              </Link>
              <Link href="/admin" className="btn btn-ghost">
                Admin Portal
              </Link>
            </div>

            {/* Workload Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Workload Distribution</h2>
                <p className="text-sm text-gray-500 mb-4">Active cases per caseworker</p>
                <WorkloadBarChart data={data.workload} />
              </div>

              {/* Caseworker Performance Table */}
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Caseworker Performance</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Name</th>
                        <th className="table-header-cell">Active</th>
                        <th className="table-header-cell">Completed</th>
                        <th className="table-header-cell">Approval</th>
                        <th className="table-header-cell">Avg Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.workload.map((cw: any) => (
                        <tr key={cw.id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${cw.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="font-medium text-sm">{cw.name}</span>
                            </div>
                          </td>
                          <td className="table-cell text-sm">{cw.activeQueue}</td>
                          <td className="table-cell text-sm">{cw.completed}</td>
                          <td className="table-cell">
                            <ApprovalRateBar rate={cw.approvalRate} />
                          </td>
                          <td className="table-cell text-sm">{cw.avgDaysToDecision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* LTV/DTI Risk Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">LTV Risk Analysis</h2>
                <p className="text-sm text-gray-500 mb-4">Approval vs denial by LTV range</p>
                <LTVDTIStackedChart data={data.ltvAnalysis} label="LTV" />
              </div>
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">DTI Risk Analysis</h2>
                <p className="text-sm text-gray-500 mb-4">Approval vs denial by DTI range</p>
                <LTVDTIStackedChart data={data.dtiAnalysis} label="DTI" />
              </div>
            </div>

            {/* Performance Trend */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Performance Trend</h2>
              <p className="text-sm text-gray-500 mb-4">Completed applications per month by caseworker</p>
              <PerformanceTrendChart data={data.performanceTrend} caseworkerNames={data.caseworkerNames} />
            </div>

            {/* Recent Assignment Activity */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Assignment Activity</h2>
              </div>
              {data.recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No assignment activity yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          activity.action === 'assigned' ? 'bg-green-500' :
                          activity.action === 'reassigned' ? 'bg-blue-500' :
                          activity.action === 'unassigned' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`} />
                        <div>
                          <span className="text-sm">
                            <span className="font-medium">{activity.borrowerName}</span>
                            {' '}
                            <span className="text-gray-500">{activity.action} to</span>
                            {' '}
                            <span className="font-medium">{activity.caseworkerName}</span>
                          </span>
                          {activity.note && (
                            <p className="text-xs text-gray-400">{activity.note}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-8 text-sm text-gray-500 text-center">
              Demo application. All data is synthetic for presentation purposes only.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
