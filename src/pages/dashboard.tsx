import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import UserMenu from '../components/UserMenu'
import ApplicationCard from '../components/ApplicationCard'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Dashboard() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const { data: applications, error, isLoading } = useSWR(
    session ? '/api/apps' : null,
    fetcher
  )

  // Redirect unauthenticated users to signin
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard')
    }
  }, [authStatus, router])

  // Show loading while checking auth
  if (authStatus === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </main>
    )
  }

  // Don't render anything while redirecting
  if (authStatus === 'unauthenticated') {
    return null
  }

  // Calculate statistics
  const stats = applications ? {
    total: applications.length,
    draft: applications.filter((a: any) => a.status === 'draft').length,
    submitted: applications.filter((a: any) => a.status === 'submitted').length,
    in_review: applications.filter((a: any) => a.status === 'in_review').length,
    approved: applications.filter((a: any) => a.status === 'approved').length,
    denied: applications.filter((a: any) => a.status === 'denied').length
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
              <span className="text-sm font-medium text-gray-600">My Dashboard</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage your mortgage applications
            </p>
          </div>
          <Link href="/apply/new" className="btn btn-primary">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Application
          </Link>
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
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-gray-600">{stats.draft}</div>
                  <div className="stat-label">Draft</div>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card border-l-4 border-warning-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-value text-warning-600">{stats.in_review}</div>
                  <div className="stat-label">In Review</div>
                </div>
                <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center text-warning-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center text-success-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center text-danger-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card p-6 mb-6">
            <div className="alert alert-error">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Failed to load applications. Please try again later.
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading your applications...
            </div>
          </div>
        )}

        {/* Empty State */}
        {applications && applications.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No applications yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Ready to start your homeownership journey? Begin your mortgage application today and take the first step toward your dream home.
            </p>
            <Link href="/apply/new" className="btn btn-primary btn-lg">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start Your First Application
            </Link>
          </div>
        )}

        {/* Applications List */}
        {applications && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <ApplicationCard
                key={app.id}
                id={app.id}
                status={app.status}
                data={app.data}
                updatedAt={app.updatedAt}
                createdAt={app.createdAt}
              />
            ))}
          </div>
        )}

        {/* Footer Note */}
        <p className="mt-8 text-sm text-gray-500 text-center">
          Demo application. All data is synthetic for presentation purposes only.
        </p>
      </div>
    </main>
  )
}
