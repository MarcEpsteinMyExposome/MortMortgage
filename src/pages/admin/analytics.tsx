import useSWR from 'swr'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import UserMenu from '../../components/UserMenu'
import StatusPieChart from '../../components/charts/StatusPieChart'
import VolumeChart from '../../components/charts/VolumeChart'
import ApprovalRateBar from '../../components/charts/ApprovalRateBar'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const WorkloadBarChart = dynamic(() => import('../../components/charts/WorkloadBarChart'), { ssr: false })
const LTVDTIStackedChart = dynamic(() => import('../../components/charts/LTVDTIStackedChart'), { ssr: false })
const PerformanceTrendChart = dynamic(() => import('../../components/charts/PerformanceTrendChart'), { ssr: false })

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: 'Single Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
  multi_family: 'Multi-Family',
  manufactured: 'Manufactured',
  unknown: 'Unknown'
}

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  single_family: '#3B82F6',
  condo: '#10B981',
  townhouse: '#F59E0B',
  multi_family: '#8B5CF6',
  manufactured: '#EC4899',
  unknown: '#6B7280'
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Analytics() {
  const { data, error, isLoading } = useSWR('/api/admin/analytics', fetcher)
  const { data: supData } = useSWR('/api/supervisor/analytics', fetcher)

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
              <span className="text-sm font-medium text-gray-600">Admin Analytics</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-primary-600 hover:text-primary-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <p className="text-sm text-gray-500">
              Overview of mortgage application metrics and trends
            </p>
          </div>
          <Link href="/admin" className="btn btn-ghost">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Applications
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading analytics...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Failed to load analytics data. Please try again.
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Applications */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {data.summary.totalApplications}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* This Month */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {data.summary.thisMonth}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">New applications</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Approval Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {data.summary.approvalRate}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Of decided apps</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Loan Amount */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg. Loan Amount</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {formatCurrency(data.summary.avgLoanAmount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Per application</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Volume Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Volume</h3>
                <p className="text-sm text-gray-500 mb-4">Applications over the last 6 months</p>
                <VolumeChart data={data.volumeByMonth} />
              </div>

              {/* Status Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <p className="text-sm text-gray-500 mb-4">Current breakdown by status</p>
                <StatusPieChart data={data.statusDistribution} />
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Loan Type Breakdown */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Type Breakdown</h3>
                <p className="text-sm text-gray-500 mb-4">Conventional vs FHA and others</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.loanTypeBreakdown}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="type"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#374151', fontSize: 12 }}
                        width={70}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'count') return [value, 'Applications']
                          if (name === 'avgAmount') return [formatCurrency(value), 'Avg Amount']
                          return [value, name]
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Loan type details */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    {data.loanTypeBreakdown.map((item: any) => (
                      <div key={item.type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{item.type}</span>
                        <span className="text-sm font-medium text-gray-900">
                          Avg: {formatCurrency(item.avgAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Property Type Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Type Distribution</h3>
                <p className="text-sm text-gray-500 mb-4">Types of properties in applications</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.propertyTypeBreakdown.map((item: any) => ({
                        ...item,
                        label: PROPERTY_TYPE_LABELS[item.type] || item.type
                      }))}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#374151', fontSize: 12 }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [value, 'Applications']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                        {data.propertyTypeBreakdown.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PROPERTY_TYPE_COLORS[entry.type] || '#6B7280'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Supervisor Charts */}
            {supData && (
              <>
                {/* Workload & Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Workload Distribution</h3>
                    <p className="text-sm text-gray-500 mb-4">Active cases per caseworker</p>
                    <WorkloadBarChart data={supData.workload} />
                  </div>

                  <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Caseworker Performance</h3>
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
                          {supData.workload.map((cw: any) => (
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

                {/* LTV/DTI Risk */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">LTV Risk Analysis</h3>
                    <p className="text-sm text-gray-500 mb-4">Approval vs denial by LTV range</p>
                    <LTVDTIStackedChart data={supData.ltvAnalysis} label="LTV" />
                  </div>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">DTI Risk Analysis</h3>
                    <p className="text-sm text-gray-500 mb-4">Approval vs denial by DTI range</p>
                    <LTVDTIStackedChart data={supData.dtiAnalysis} label="DTI" />
                  </div>
                </div>

                {/* Performance Trend */}
                <div className="card p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Trend</h3>
                  <p className="text-sm text-gray-500 mb-4">Completed applications per month by caseworker</p>
                  <PerformanceTrendChart data={supData.performanceTrend} caseworkerNames={supData.caseworkerNames} />
                </div>
              </>
            )}

            {/* Recent Activity Feed */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <p className="text-sm text-gray-500 mb-4">Latest application status updates</p>

              {data.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-mono text-gray-600">
                          {activity.appId}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.change}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="mt-8 text-sm text-gray-500 text-center">
              Data refreshes automatically. Last updated: {new Date().toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </main>
  )
}
