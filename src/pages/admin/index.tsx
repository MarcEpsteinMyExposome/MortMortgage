import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import UserMenu from '../../components/UserMenu'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  draft: {
    bg: 'bg-warning-100',
    text: 'text-warning-800',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  },
  submitted: {
    bg: 'bg-primary-100',
    text: 'text-primary-800',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  },
  approved: {
    bg: 'bg-success-100',
    text: 'text-success-800',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  denied: {
    bg: 'bg-danger-100',
    text: 'text-danger-800',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  pending_documents: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  in_review: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  }
}

export default function Admin() {
  const { data, error, mutate } = useSWR('/api/apps', fetcher)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filteredApps = data?.filter((a: any) =>
    statusFilter === 'all' || a.status === statusFilter
  ) || []

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this application?')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutate()
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  function getBorrowerName(app: any): string {
    const borrower = app.borrowers?.[0]
    if (!borrower?.name) return 'Unknown'
    return `${borrower.name.firstName || ''} ${borrower.name.lastName || ''}`.trim() || 'Unknown'
  }

  function getLoanAmount(app: any): string {
    const amount = app.data?.loan?.loanAmount
    return amount ? `$${amount.toLocaleString()}` : '-'
  }

  function getPropertyAddress(app: any): string {
    const addr = app.data?.property?.address
    if (!addr) return '-'
    return `${addr.city || ''}, ${addr.state || ''}`.trim() || '-'
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const stats = data ? {
    total: data.length,
    draft: data.filter((a: any) => a.status === 'draft').length,
    submitted: data.filter((a: any) => a.status === 'submitted').length,
    in_review: data.filter((a: any) => a.status === 'in_review').length,
    approved: data.filter((a: any) => a.status === 'approved').length,
    denied: data.filter((a: any) => a.status === 'denied').length
  } : null

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
              <span className="text-sm font-medium text-gray-600">Admin Portal</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and review mortgage applications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/analytics" className="btn btn-ghost">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </Link>
            <Link href="/apply/new" className="btn btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Application
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="stat-card border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-gray-900">{stats.total}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-warning-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-warning-600">{stats.draft}</div>
                  <div className="stat-label">Draft</div>
                </div>
                <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center text-warning-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-primary-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-primary-600">{stats.submitted}</div>
                  <div className="stat-label">Submitted</div>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-purple-600">{stats.in_review}</div>
                  <div className="stat-label">In Review</div>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-success-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-success-600">{stats.approved}</div>
                  <div className="stat-label">Approved</div>
                </div>
                <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center text-success-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-danger-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-danger-600">{stats.denied}</div>
                  <div className="stat-label">Denied</div>
                </div>
                <div className="w-12 h-12 bg-danger-50 rounded-xl flex items-center justify-center text-danger-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="pending_documents">Pending Documents</option>
            </select>
            <span className="text-sm text-gray-500 ml-auto">
              Showing {filteredApps.length} of {data?.length || 0} applications
            </span>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card overflow-hidden">
          {error && (
            <div className="alert alert-error m-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Failed to load applications
              </div>
            </div>
          )}

          {!data && !error && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading applications...
              </div>
            </div>
          )}

          {data && data.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first mortgage application.</p>
              <Link href="/apply/new" className="btn btn-primary">
                Start an Application
              </Link>
            </div>
          )}

          {filteredApps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Borrower</th>
                    <th className="table-header-cell">Loan Amount</th>
                    <th className="table-header-cell">Property</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app: any) => {
                    const statusConfig = STATUS_CONFIG[app.status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: null }
                    return (
                      <tr key={app.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                              {getBorrowerName(app).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{getBorrowerName(app)}</div>
                              <div className="text-xs text-gray-500 font-mono">{app.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="font-semibold text-gray-900">{getLoanAmount(app)}</span>
                        </td>
                        <td className="table-cell text-gray-600">{getPropertyAddress(app)}</td>
                        <td className="table-cell">
                          <span className={`badge ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.icon}
                            <span className="ml-1.5">{app.status}</span>
                          </span>
                        </td>
                        <td className="table-cell text-gray-500">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/apps/${app.id}`}
                              className="btn btn-sm btn-ghost"
                            >
                              View
                            </Link>
                            <Link
                              href={`/apply/${app.id}`}
                              className="btn btn-sm btn-ghost text-success-600"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(app.id)}
                              disabled={deleting === app.id}
                              className="btn btn-sm btn-ghost text-danger-600 disabled:opacity-50"
                            >
                              {deleting === app.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-sm text-gray-500 text-center">
          Demo application. All data is synthetic for presentation purposes only.
        </p>
      </div>
    </main>
  )
}
